import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "../icons";

export interface LensPos {
  x: number; // 0..1, relative to the stage box
  y: number;
}

const LENS_SIZE_PCT = 0.32; // the lens covers 32% of the stage's width/height

/**
 * The draggable square inspection lens, overlaid on top of a product stage.
 * Pointer-driven (works for mouse and touch alike) and constrained so the
 * lens never drifts off the valid product surface. Purely positional — the
 * actual "magnification" happens in <MagnifiedView>, which reads the same
 * lens position to crop/scale a duplicate render of the product.
 */
export function MagnifierLens({ lens, onMove, active }: { lens: LensPos; onMove: (p: LensPos) => void; active: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const clamp = (v: number, half: number) => Math.min(1 - half, Math.max(half, v));

  const moveFromClient = (clientX: number, clientY: number) => {
    const rect = boxRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const half = LENS_SIZE_PCT / 2;
    const x = clamp((clientX - rect.left) / rect.width, half);
    const y = clamp((clientY - rect.top) / rect.height, half);
    onMove({ x, y });
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
  }, [active]);

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
 * which is the point of a print-quality inspector.
 */
export function MagnifiedView({
  lens,
  zoom,
  setZoom,
  renderStage,
  onClose,
  panelSize = 240,
}: {
  lens: LensPos;
  zoom: number;
  setZoom: (z: number) => void;
  renderStage: (pxSize: number) => ReactNode;
  onClose?: () => void;
  panelSize?: number;
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
