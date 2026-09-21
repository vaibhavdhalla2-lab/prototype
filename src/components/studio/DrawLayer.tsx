import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DrawStroke, DrawTool, SmoothingLevel } from "../../lib/store";
import { refineTransform } from "../../lib/refine";

const TOOL_WIDTH: Record<DrawTool, number> = { pencil: 2.2, marker: 7, brush: 11, pen: 3.2, eraser: 16 };
const TOOL_OPACITY: Record<DrawTool, number> = { pencil: 0.8, marker: 0.95, brush: 0.85, pen: 1, eraser: 1 };
const SMOOTHING_WINDOW: Record<SmoothingLevel, number> = { none: 1, light: 2, medium: 3, strong: 5 };

function svgPoint(e: ReactPointerEvent<SVGElement>): { x: number; y: number } {
  const target = e.currentTarget as SVGGraphicsElement;
  const svg = target.ownerSVGElement;
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}

/** Simple moving-average smoothing — enough to take the jitter out of a mouse-drawn line without a heavier curve-fitting pass. */
function smooth(points: { x: number; y: number }[], windowSize: number): { x: number; y: number }[] {
  if (windowSize <= 1 || points.length < 3) return points;
  const half = Math.floor(windowSize / 2);
  return points.map((_, i) => {
    const from = Math.max(0, i - half);
    const to = Math.min(points.length - 1, i + half);
    let sx = 0;
    let sy = 0;
    for (let j = from; j <= to; j++) {
      sx += points[j].x;
      sy += points[j].y;
    }
    const n = to - from + 1;
    return { x: sx / n, y: sy / n };
  });
}

interface DrawLayerProps {
  strokes: DrawStroke[];
  interactive: boolean;
  tool?: DrawTool;
  color?: string;
  eraseColor?: string;
  /** Explicit brush size/opacity from the Draw panel's sliders — falls back to the tool's default when omitted. */
  widthOverride?: number;
  opacityOverride?: number;
  smoothing?: SmoothingLevel;
  onStrokeEnd?: (stroke: DrawStroke) => void;
  /** When true, renders the completed strokes cleaned up and recomposed into printArea. */
  refined?: boolean;
  printArea?: { x: number; y: number; width: number; height: number };
}

export default function DrawLayer({
  strokes,
  interactive,
  tool = "marker",
  color = "#1a1712",
  eraseColor = "#f1ead9",
  widthOverride,
  opacityOverride,
  smoothing = "none",
  onStrokeEnd,
  refined,
  printArea,
}: DrawLayerProps) {
  const [liveD, setLiveD] = useState<string | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);

  const strokeColor = tool === "eraser" ? eraseColor : color;
  const strokeWidth = widthOverride ?? TOOL_WIDTH[tool];
  const strokeOpacity = opacityOverride ?? TOOL_OPACITY[tool];

  const buildPath = (pts: { x: number; y: number }[]) => {
    const smoothed = smooth(pts, SMOOTHING_WINDOW[smoothing]);
    return smoothed.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  };

  const onDown = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!interactive) return;
    drawing.current = true;
    const p = svgPoint(e);
    pointsRef.current = [p];
    setLiveD(`M${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!interactive || !drawing.current) return;
    const p = svgPoint(e);
    pointsRef.current.push(p);
    setLiveD(buildPath(pointsRef.current));
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (pointsRef.current.length > 1) {
      const d = buildPath(pointsRef.current);
      onStrokeEnd?.({ id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, d, color: strokeColor, width: strokeWidth, opacity: strokeOpacity });
    } else if (pointsRef.current.length === 1) {
      const p = pointsRef.current[0];
      const d = `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${(p.x + 0.2).toFixed(1)},${(p.y + 0.2).toFixed(1)}`;
      onStrokeEnd?.({ id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, d, color: strokeColor, width: strokeWidth, opacity: strokeOpacity });
    }
    pointsRef.current = [];
    setLiveD(null);
  };

  const transform = refined && printArea ? refineTransform(strokes, printArea) : "";

  return (
    <g>
      <g transform={transform || undefined} filter={refined ? "url(#refine-smooth)" : undefined}>
        {strokes.map((s) => (
          <path
            key={s.id}
            d={s.d}
            stroke={s.color}
            strokeWidth={refined ? s.width * 1.15 : s.width}
            strokeOpacity={refined ? 1 : s.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </g>
      {liveD && <path d={liveD} stroke={strokeColor} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      {interactive && (
        <rect
          x={0}
          y={0}
          width={360}
          height={440}
          fill="transparent"
          style={{ cursor: "crosshair", touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={finish}
          onPointerLeave={finish}
        />
      )}
    </g>
  );
}
