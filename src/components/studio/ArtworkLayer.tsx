import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { ArtworkState } from "../../lib/store";

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

interface ArtworkLayerProps {
  artwork: ArtworkState;
  printArea: { x: number; y: number; width: number; height: number };
  interactive: boolean;
  onChange: (a: Partial<ArtworkState>) => void;
}

const BASE = 96; // base artwork box size in viewBox units, before scale

export default function ArtworkLayer({ artwork, printArea, interactive, onChange }: ArtworkLayerProps) {
  const cx = printArea.x + artwork.x * printArea.width;
  const cy = printArea.y + artwork.y * printArea.height;
  const size = BASE * artwork.scale;

  const dragMode = useRef<"move" | "resize" | "rotate" | null>(null);
  const start = useRef({ x: 0, y: 0, artX: 0, artY: 0, scale: 1, rotation: 0 });

  const beginDrag = (mode: "move" | "resize" | "rotate") => (e: ReactPointerEvent<SVGElement>) => {
    if (!interactive) return;
    e.stopPropagation();
    dragMode.current = mode;
    const p = svgPoint(e);
    start.current = { x: p.x, y: p.y, artX: artwork.x, artY: artwork.y, scale: artwork.scale, rotation: artwork.rotation };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent<SVGElement>) => {
    if (!dragMode.current) return;
    const p = svgPoint(e);
    if (dragMode.current === "move") {
      const dx = (p.x - start.current.x) / printArea.width;
      const dy = (p.y - start.current.y) / printArea.height;
      onChange({ x: Math.min(1, Math.max(0, start.current.artX + dx)), y: Math.min(1, Math.max(0, start.current.artY + dy)) });
    } else if (dragMode.current === "resize") {
      const dist = Math.hypot(p.x - cx, p.y - cy);
      const baseDist = (BASE * start.current.scale * Math.SQRT2) / 2;
      const factor = dist / (baseDist || 1);
      const newScale = Math.min(2.4, Math.max(0.35, start.current.scale * factor));
      onChange({ scale: newScale });
    } else if (dragMode.current === "rotate") {
      const angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      onChange({ rotation: Math.round(angle) });
    }
  };

  const endDrag = () => {
    dragMode.current = null;
  };

  return (
    <g onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
      <g transform={`translate(${cx},${cy}) rotate(${artwork.rotation})`}>
        <image
          href={artwork.src}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: interactive ? "move" : "default" }}
          onPointerDown={beginDrag("move")}
        />
        {interactive && (
          <>
            <rect x={-size / 2 - 3} y={-size / 2 - 3} width={size + 6} height={size + 6} fill="none" stroke="#9a6a43" strokeDasharray="4 4" strokeWidth={1.2} />
            <line x1={0} y1={-size / 2 - 3} x2={0} y2={-size / 2 - 22} stroke="#9a6a43" strokeWidth={1.2} />
            <circle cx={0} cy={-size / 2 - 26} r={7} fill="#faf7f0" stroke="#9a6a43" strokeWidth={1.4} onPointerDown={beginDrag("rotate")} style={{ cursor: "grab" }} />
            <rect
              x={size / 2 - 2}
              y={size / 2 - 2}
              width={12}
              height={12}
              rx={2}
              fill="#faf7f0"
              stroke="#9a6a43"
              strokeWidth={1.4}
              onPointerDown={beginDrag("resize")}
              style={{ cursor: "nwse-resize" }}
            />
          </>
        )}
      </g>
    </g>
  );
}
