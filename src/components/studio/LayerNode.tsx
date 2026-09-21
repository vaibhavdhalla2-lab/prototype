import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

/** How close (in 0..1 print-area-relative units) a drag has to land to the center line before it snaps to it. */
const SNAP_THRESHOLD = 0.018;

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

export interface LayerTransform {
  x: number; // 0..1 relative to print area
  y: number;
  scale: number;
  rotation: number;
}

interface LayerNodeProps {
  transform: LayerTransform;
  printArea: { x: number; y: number; width: number; height: number };
  /** Local bounding box (before scale) that the children render inside, centered on (0,0). Used to size the selection outline + handles. */
  size: { width: number; height: number };
  interactive: boolean;
  selected: boolean;
  locked?: boolean;
  onChange: (patch: Partial<LayerTransform>) => void;
  onSelect?: () => void;
  children: ReactNode;
}

/**
 * The shared move / resize / rotate gizmo for every non-drawing layer (text,
 * image, graphic) — generalized from what was a one-off in ArtworkLayer, so
 * every layer type gets identical, predictable interaction.
 */
export default function LayerNode({ transform, printArea, size, interactive, selected, locked, onChange, onSelect, children }: LayerNodeProps) {
  const cx = printArea.x + transform.x * printArea.width;
  const cy = printArea.y + transform.y * printArea.height;
  const w = size.width * transform.scale;
  const h = size.height * transform.scale;

  const dragMode = useRef<"move" | "resize" | "rotate" | null>(null);
  const start = useRef({ x: 0, y: 0, tx: 0, ty: 0, scale: 1 });
  const [guide, setGuide] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  const canInteract = interactive && !locked;

  const beginDrag = (mode: "move" | "resize" | "rotate") => (e: ReactPointerEvent<SVGElement>) => {
    if (!canInteract) return;
    e.stopPropagation();
    onSelect?.();
    dragMode.current = mode;
    const p = svgPoint(e);
    start.current = { x: p.x, y: p.y, tx: transform.x, ty: transform.y, scale: transform.scale };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent<SVGElement>) => {
    if (!dragMode.current) return;
    const p = svgPoint(e);
    if (dragMode.current === "move") {
      const dx = (p.x - start.current.x) / printArea.width;
      const dy = (p.y - start.current.y) / printArea.height;
      let nx = Math.min(1, Math.max(0, start.current.tx + dx));
      let ny = Math.min(1, Math.max(0, start.current.ty + dy));
      const snapX = Math.abs(nx - 0.5) < SNAP_THRESHOLD;
      const snapY = Math.abs(ny - 0.5) < SNAP_THRESHOLD;
      if (snapX) nx = 0.5;
      if (snapY) ny = 0.5;
      setGuide({ x: snapX, y: snapY });
      onChange({ x: nx, y: ny });
    } else if (dragMode.current === "resize") {
      const dist = Math.hypot(p.x - cx, p.y - cy);
      const halfDiag = (Math.hypot(size.width, size.height) * start.current.scale) / 2;
      const factor = dist / (halfDiag || 1);
      onChange({ scale: Math.min(3, Math.max(0.25, start.current.scale * factor)) });
    } else if (dragMode.current === "rotate") {
      const angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      onChange({ rotation: Math.round(angle) });
    }
  };

  const endDrag = () => {
    dragMode.current = null;
    setGuide({ x: false, y: false });
  };

  return (
    <g onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
      {/* smart guides: subtle center lines, shown only while actively dragging into alignment — never left behind */}
      {guide.x && (
        <line
          x1={printArea.x + printArea.width / 2}
          y1={printArea.y}
          x2={printArea.x + printArea.width / 2}
          y2={printArea.y + printArea.height}
          stroke="#c8a96b"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.75}
          pointerEvents="none"
        />
      )}
      {guide.y && (
        <line
          x1={printArea.x}
          y1={printArea.y + printArea.height / 2}
          x2={printArea.x + printArea.width}
          y2={printArea.y + printArea.height / 2}
          stroke="#c8a96b"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.75}
          pointerEvents="none"
        />
      )}
      <g
        transform={`translate(${cx},${cy}) rotate(${transform.rotation})`}
        onPointerDown={canInteract ? beginDrag("move") : onSelect ? () => onSelect() : undefined}
        style={{ cursor: canInteract ? "move" : selected ? "default" : "pointer" }}
      >
        {children}
        {selected && (
          <>
            <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} fill="none" stroke="#c8a96b" strokeDasharray={locked ? "2 3" : "4 4"} strokeWidth={1.3} />
            {canInteract && (
              <>
                <line x1={0} y1={-h / 2 - 4} x2={0} y2={-h / 2 - 24} stroke="#c8a96b" strokeWidth={1.2} />
                <circle cx={0} cy={-h / 2 - 28} r={7} fill="#faf7f0" stroke="#c8a96b" strokeWidth={1.4} onPointerDown={beginDrag("rotate")} style={{ cursor: "grab" }} />
                <rect
                  x={w / 2 - 2}
                  y={h / 2 - 2}
                  width={12}
                  height={12}
                  rx={2}
                  fill="#faf7f0"
                  stroke="#c8a96b"
                  strokeWidth={1.4}
                  onPointerDown={beginDrag("resize")}
                  style={{ cursor: "nwse-resize" }}
                />
              </>
            )}
            {locked && (
              <rect x={-9} y={-h / 2 - 30} width={18} height={16} rx={3} fill="#241f1a" opacity={0.85} />
            )}
          </>
        )}
      </g>
    </g>
  );
}
