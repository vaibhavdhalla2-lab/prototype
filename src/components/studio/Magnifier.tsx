import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "../icons";

export interface LensPos {
  x: number; // 0..1, relative to the stage's square container
  y: number;
}

const LENS_SIZE_PCT = 0.32; // the lens covers 32% of the stage's width/height

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
  const { vx, vy } = containerFractionToViewBox(lens);
  const relX = (vx - printArea.x) / printArea.width;
  const relY = (vy - printArea.y) / printArea.height;
  const relW = (LENS_SIZE_PCT * VIEWBOX_W * RENDER_W_FRACTION) / printArea.width;
  const relH = (LENS_SIZE_PCT * VIEWBOX_H) / printArea.height;
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

  const clampToPrintArea = (candidate: LensPos): LensPos => {
    const half = LENS_SIZE_PCT / 2;
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
    return { x, y };
  };

  const moveFromClient = (clientX: number, clientY: number) => {
    const rect = boxRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    onMove(clampToPrintArea({ x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }));
  };

  useEffect(() => {
    if (!active) return;
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      moveFromClient(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, printArea.x, printArea.y, printArea.width, printArea.height]);

  if (!active) return null;

  return (
    <div
      ref={boxRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        draggingRef.current = true;
        moveFromClient(e.clientX, e.clientY);
      }}
      className="absolute z-20 cursor-grab touch-none rounded-lg border-2 border-[#c8a96b] bg-[#c8a96b]/10 shadow-[0_0_0_2000px_rgba(23,21,26,0.18),0_8px_24px_-10px_rgba(36,31,26,0.5)] transition-[left,top] duration-75 ease-out active:cursor-grabbing"
      style={{
        left: `${(lens.x - LENS_SIZE_PCT / 2) * 100}%`,
        top: `${(lens.y - LENS_SIZE_PCT / 2) * 100}%`,
        width: `${LENS_SIZE_PCT * 100}%`,
        height: `${LENS_SIZE_PCT * 100}%`,
      }}
    >
      <span className="absolute -left-px -top-px h-3 w-3 rounded-tl border-l-2 border-t-2 border-[#241f1a]" />
      <span className="absolute -right-px -top-px h-3 w-3 rounded-tr border-r-2 border-t-2 border-[#241f1a]" />
      <span className="absolute -bottom-px -left-px h-3 w-3 rounded-bl border-b-2 border-l-2 border-[#241f1a]" />
      <span className="absolute -bottom-px -right-px h-3 w-3 rounded-br border-b-2 border-r-2 border-[#241f1a]" />
    </div>
  );
}

/**
 * The magnified secondary preview: a fixed-size clipped window showing a
 * duplicate, scaled-and-translated render of the exact same product stage,
 * so the crop always corresponds precisely to the lens position. Because
 * everything the studio renders is vector (SVG), this stays crisp at any
 * zoom — and uploaded raster artwork will visibly show its real resolution,
 * which is the point of a print-quality inspector. When `renderStage`
 * includes the interactive layer stack, this doubles as a real editing
 * surface: drawing/dragging here hits the exact same SVG coordinate space
 * as the main canvas (via getScreenCTM), just rendered larger.
 */
export function MagnifiedView({
  lens,
  zoom,
  setZoom,
  renderStage,
  onClose,
  panelSize = 240,
  toolbar,
}: {
  lens: LensPos;
  zoom: number;
  setZoom: (z: number) => void;
  renderStage: (pxSize: number) => ReactNode;
  onClose?: () => void;
  panelSize?: number;
  toolbar?: ReactNode;
}) {
  const inner = panelSize * zoom;
  const tx = -(lens.x * inner - panelSize / 2);
  const ty = -(lens.y * inner - panelSize / 2);

  return (
    <div className="rounded-2xl border border-line-soft bg-paper p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint">Detail view · {zoom.toFixed(1)}×</p>
        {onClose && (
          <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close detail view">
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {toolbar}
      <div
        className="relative mt-3 overflow-hidden rounded-xl border border-line-soft bg-ivory-dim"
        style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: panelSize }}
      >
        <div style={{ position: "absolute", width: inner, height: inner, transform: `translate(${tx}px, ${ty}px)` }}>{renderStage(inner)}</div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => setZoom(Math.max(1.5, +(zoom - 0.5).toFixed(1)))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink-soft"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => setZoom(2.5)}
          className="rounded-full border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-soft hover:border-ink-soft"
        >
          Reset
        </button>
        <button
          onClick={() => setZoom(Math.min(4, +(zoom + 0.5).toFixed(1)))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-ink-soft"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-faint">Drag the square on the product to inspect a different area.</p>
    </div>
  );
}
