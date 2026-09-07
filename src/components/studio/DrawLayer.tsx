import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DrawStroke, DrawTool } from "../../lib/store";
import { refineTransform } from "../../lib/refine";

const TOOL_WIDTH: Record<DrawTool, number> = { marker: 7, pencil: 2.2, brush: 11, eraser: 16 };
const TOOL_OPACITY: Record<DrawTool, number> = { marker: 0.95, pencil: 0.8, brush: 0.85, eraser: 1 };

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

interface DrawLayerProps {
  strokes: DrawStroke[];
  interactive: boolean;
  tool?: DrawTool;
  color?: string;
  eraseColor?: string;
  onStrokeEnd?: (stroke: DrawStroke) => void;
  /** When true, renders the completed strokes cleaned up and recomposed into printArea. */
  refined?: boolean;
  printArea?: { x: number; y: number; width: number; height: number };
}

export default function DrawLayer({ strokes, interactive, tool = "marker", color = "#1a1712", eraseColor = "#f1ead9", onStrokeEnd, refined, printArea }: DrawLayerProps) {
  const [liveD, setLiveD] = useState<string | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);

  const strokeColor = tool === "eraser" ? eraseColor : color;

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
    setLiveD((d) => `${d} L${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (pointsRef.current.length > 1) {
      const d = pointsRef.current.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      onStrokeEnd?.({ id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, d, color: strokeColor, width: TOOL_WIDTH[tool], opacity: TOOL_OPACITY[tool] });
    } else if (pointsRef.current.length === 1) {
      const p = pointsRef.current[0];
      const d = `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${(p.x + 0.2).toFixed(1)},${(p.y + 0.2).toFixed(1)}`;
      onStrokeEnd?.({ id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, d, color: strokeColor, width: TOOL_WIDTH[tool], opacity: TOOL_OPACITY[tool] });
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
      {liveD && <path d={liveD} stroke={strokeColor} strokeWidth={TOOL_WIDTH[tool]} strokeOpacity={TOOL_OPACITY[tool]} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
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
