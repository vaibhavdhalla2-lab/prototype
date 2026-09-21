import { useEffect, useRef, useState, type ReactNode, type WheelEvent as ReactWheelEvent, type PointerEvent as ReactPointerEvent } from "react";
import { IconClose } from "../icons";

export interface LensPos {
  x: number; // 0..1, relative to the stage's square container
  y: number;
  /** 0..1, how much of the stage's width/height the lens covers. Resizable via the lens's corner handle. */
  size?: number;
}

const DEFAULT_LENS_SIZE = 0.32;
const MIN_LENS_SIZE = 0.16;
const MAX_LENS_SIZE = 0.62;

// Every product face shares one 360x440 SVG viewBox (see ProductFaces.tsx / Garment.tsx).
// The square stage container fits that viewBox via preserveAspectRatio="xMidYMid meet",
// so the rendered art is pillarboxed horizontally — these constants convert between
// "fraction of the square container" (what the lens is dragged in) and true viewBox
// coordinates, so a selection can be described in the same space the product itself
// is drawn in, not arbitrary screen pixels.
const VIEWBOX_W = 360;
const VIEWBOX_H = 440;
const RENDER_W_FRACTION = VIEWBOX_W / VIEWBOX_H;
const SIDE_GAP = (1 - RENDER_W_FRACTION) / 2;

export interface PrintAreaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RegionSelection {
  side: "front" | "back";
  /** 0..1, relative to the print area — the same coordinate space every layer's x/y already uses. */
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

function containerFractionToViewBox(lens: LensPos): { vx: number; vy: number } {
  return { vx: ((lens.x - SIDE_GAP) / RENDER_W_FRACTION) * VIEWBOX_W, vy: lens.y * VIEWBOX_H };
}

function regionLabel(relX: number, relY: number): string {
  const h = relX < 0.34 ? "left" : relX > 0.66 ? "right" : "center";
  const v = relY < 0.34 ? "upper" : relY > 0.66 ? "lower" : "middle";
  if (h === "center" && v === "middle") return "Center";
  return `${v[0].toUpperCase()}${v.slice(1)} ${h}`;
}

/**
 * Converts the on-screen lens position into a product-relative region — the
 * conceptual {product/side/x/y/width/height} selection MUSE and the layer
 * system reason about, rather than raw DOM/container coordinates. This is
 * the seam a future true UV-mapped 3D selection would replace internally
 * without changing anything that consumes `RegionSelection`.
 */
export function lensToRegion(lens: LensPos, printArea: PrintAreaRect, side: "front" | "back"): RegionSelection {
  const size = lens.size ?? DEFAULT_LENS_SIZE;
  const { vx, vy } = containerFractionToViewBox(lens);
  const relX = (vx - printArea.x) / printArea.width;
  const relY = (vy - printArea.y) / printArea.height;
  const relW = (size * VIEWBOX_W * RENDER_W_FRACTION) / printArea.width;
  const relH = (size * VIEWBOX_H) / printArea.height;
  return {
    side,
    x: Math.min(1, Math.max(0, relX)),
    y: Math.min(1, Math.max(0, relY)),
    width: relW,
    height: relH,
    label: regionLabel(relX, relY),
  };
}

/**
 * The draggable square inspection lens, overlaid on top of a product stage.
 * Pointer-driven (works for mouse and touch alike) and constrained so the
 * lens stays over the product's actual print-safe region rather than
 * drifting into empty margin.
 */
export function MagnifierLens({ lens, onMove, printArea, active }: { lens: LensPos; onMove: (p: LensPos) => void; printArea: PrintAreaRect; active: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const resizeStart = useRef({ clientX: 0, clientY: 0, size: DEFAULT_LENS_SIZE });
  const size = lens.size ?? DEFAULT_LENS_SIZE;

  const clampToPrintArea = (candidate: LensPos): LensPos => {
    const s = candidate.size ?? size;
    const half = s / 2;
    let { x, y } = candidate;
    x = Math.min(1 - half, Math.max(half, x));
    y = Math.min(1 - half, Math.max(half, y));
    // keep the lens center reasonably close to the print area so it never inspects pure empty margin
    const { vx, vy } = containerFractionToViewBox({ x, y });
    const margin = 0.15;
    const minVx = printArea.x - printArea.width * margin;
    const maxVx = printArea.x + printArea.width * (1 + margin);
    const minVy = printArea.y - printArea.height * margin;
    const maxVy = printArea.y + printArea.height * (1 + margin);
    const cvx = Math.min(maxVx, Math.max(minVx, vx));
    const cvy = Math.min(maxVy, Math.max(minVy, vy));
    if (cvx !== vx || cvy !== vy) {
      x = SIDE_GAP + (cvx / VIEWBOX_W) * RENDER_W_FRACTION;
      y = cvy / VIEWBOX_H;
    }
    return { x, y, size: s };
  };

  const moveFromClient = (clientX: number, clientY: number) => {
    const rect = boxRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    onMove(clampToPrintArea({ x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height, size }));
  };

  const resizeFromClient = (clientX: number, clientY: number) => {
    const rect = boxRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dx = (clientX - resizeStart.current.clientX) / rect.width;
    const dy = (clientY - resizeStart.current.clientY) / rect.height;
    const delta = Math.max(dx, dy);
    const nextSize = Math.min(MAX_LENS_SIZE, Math.max(MIN_LENS_SIZE, resizeStart.current.size + delta));
    onMove(clampToPrintArea({ x: lens.x, y: lens.y, size: nextSize }));
  };

  useEffect(() => {
    if (!active) return;
    const onPointerMove = (e: PointerEvent) => {
      if (resizingRef.current) {
        resizeFromClient(e.clientX, e.clientY);
        return;
      }
      if (!draggingRef.current) return;
      moveFromClient(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, printArea.x, printArea.y, printArea.width, printArea.height, lens.x, lens.y, size]);

  if (!active) return null;

  return (
    <div
      ref={boxRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        draggingRef.current = true;
        moveFromClient(e.clientX, e.clientY);
      }}
      className="absolute z-20 cursor-grab touch-none rounded-lg border-2 border-[#c8a96b] bg-[#c8a96b]/10 shadow-[0_0_0_2000px_rgba(23,21,26,0.18),0_8px_24px_-10px_rgba(36,31,26,0.5)] transition-[left,top,width,height] duration-75 ease-out active:cursor-grabbing"
      style={{
        left: `${(lens.x - size / 2) * 100}%`,
        top: `${(lens.y - size / 2) * 100}%`,
        width: `${size * 100}%`,
        height: `${size * 100}%`,
      }}
    >
      <span className="absolute -left-px -top-px h-3 w-3 rounded-tl border-l-2 border-t-2 border-[#241f1a]" />
      <span className="absolute -right-px -top-px h-3 w-3 rounded-tr border-r-2 border-t-2 border-[#241f1a]" />
      <span className="absolute -bottom-px -left-px h-3 w-3 rounded-bl border-b-2 border-l-2 border-[#241f1a]" />
      <div
        role="slider"
        aria-label="Resize navigator selection"
        onPointerDown={(e) => {
          e.stopPropagation();
          resizingRef.current = true;
          resizeStart.current = { clientX: e.clientX, clientY: e.clientY, size };
        }}
        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-[#241f1a] bg-[#faf7f0] shadow-sm"
      />
    </div>
  );
}

/** The only zoom levels Precision Edit snaps to — deliberately discrete rather than an arbitrary continuous range. */
export const ZOOM_LEVELS = [1, 2, 4, 8, 12, 16, 24];
export const DEFAULT_ZOOM = 8;
export const FIT_ZOOM = 2;

/**
 * The Precision Canvas — a duplicate, scaled-and-translated render of the
 * exact same product stage as the navigator, so the crop always corresponds
 * precisely to the navigator's viewport rectangle. Because everything the
 * studio renders is vector (SVG), this stays crisp at any zoom — and
 * uploaded raster artwork will visibly show its real resolution, which is
 * the point of a print-quality editor. Since `renderStage` includes the
 * interactive layer stack, this IS a real editing surface: drawing/typing/
 * dragging here hits the exact same SVG coordinate space as the main canvas
 * (via getScreenCTM), just rendered larger — edits land in the same place
 * on the product whether made here or at normal size.
 */
export type PrecisionCursorMode = "move" | "draw" | "erase" | "text" | "hand";

const CURSOR_CLASS: Record<PrecisionCursorMode, string> = {
  move: "cursor-default",
  draw: "cursor-crosshair",
  erase: "cursor-crosshair",
  text: "cursor-text",
  hand: "cursor-grab",
};

export function MagnifiedView({
  lens,
  zoom,
  setZoom,
  renderStage,
  onClose,
  panelSize = 240,
  toolbar,
  regionLabel,
  cursorMode = "move",
  brushSize,
  onPan,
}: {
  lens: LensPos;
  zoom: number;
  setZoom: (z: number) => void;
  renderStage: (pxSize: number) => ReactNode;
  onClose?: () => void;
  panelSize?: number;
  toolbar?: ReactNode;
  /** Shown next to the zoom level, e.g. "Front · Upper chest" — spatial context tying this view back to the navigator's selection. */
  regionLabel?: string;
  /** Drives the pointer affordance so the canvas visibly communicates what a click/drag will do. */
  cursorMode?: PrecisionCursorMode;
  /** Brush/eraser diameter in stage units — used to size the following brush-preview ring when cursorMode is draw/erase. */
  brushSize?: number;
  /** When set, dragging (with cursorMode "hand") pans the viewport by calling back with the next lens position. */
  onPan?: (next: LensPos) => void;
}) {
  const inner = panelSize * zoom;
  const tx = -(lens.x * inner - panelSize / 2);
  const ty = -(lens.y * inner - panelSize / 2);
  const levelIndex = ZOOM_LEVELS.indexOf(zoom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  const onWheel = (e: ReactWheelEvent) => {
    e.preventDefault();
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (e.deltaY < 0 && idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
    else if (e.deltaY > 0 && idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (cursorMode !== "hand" || !onPan) return;
    draggingRef.current = true;
    setPanning(true);
    lastRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (draggingRef.current && onPan) {
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      onPan({ x: Math.min(1, Math.max(0, lens.x - dx / inner)), y: Math.min(1, Math.max(0, lens.y - dy / inner)), size: lens.size });
    }
  };
  const endPan = () => {
    draggingRef.current = false;
    setPanning(false);
  };

  return (
    <div className="rounded-2xl border border-[#c8a96b]/35 bg-paper p-4 shadow-[0_20px_50px_-35px_rgba(36,31,26,0.4)] animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint">Precision canvas</p>
          {regionLabel && <p className="mt-0.5 text-[13px] font-medium text-ink">{regionLabel}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close precision edit">
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {toolbar}
      <div
        ref={containerRef}
        className={`relative mt-3 overflow-hidden rounded-xl border-2 border-[#c8a96b]/50 bg-white ${CURSOR_CLASS[cursorMode]} ${panning ? "cursor-grabbing" : ""}`}
        style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: panelSize }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerLeave={() => {
          setCursorPos(null);
          endPan();
        }}
      >
        <div style={{ position: "absolute", width: inner, height: inner, transform: `translate(${tx}px, ${ty}px)` }}>{renderStage(inner)}</div>
        {cursorPos && (cursorMode === "draw" || cursorMode === "erase") && brushSize && (
          <div
            className="pointer-events-none absolute rounded-full border-[1.5px] border-[#241f1a]/60"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: Math.max(6, (brushSize * inner) / 360),
              height: Math.max(6, (brushSize * inner) / 360),
              transform: "translate(-50%, -50%)",
              background: cursorMode === "erase" ? "rgba(255,255,255,0.5)" : "rgba(36,31,26,0.08)",
            }}
          />
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => levelIndex > 0 && setZoom(ZOOM_LEVELS[levelIndex - 1])}
          disabled={levelIndex <= 0}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink-soft disabled:opacity-30"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="min-w-[42px] text-center text-[12px] font-medium tabular-nums text-ink">{zoom}×</span>
        <button
          onClick={() => levelIndex < ZOOM_LEVELS.length - 1 && setZoom(ZOOM_LEVELS[levelIndex + 1])}
          disabled={levelIndex >= ZOOM_LEVELS.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink-soft disabled:opacity-30"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(FIT_ZOOM)}
          className="ml-1 rounded-full border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-soft hover:border-ink-soft"
        >
          Fit
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-faint">Scroll to zoom · drag with Hand to pan · use the navigator to jump elsewhere.</p>
    </div>
  );
}
