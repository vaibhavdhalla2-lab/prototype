import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import CarouselArrow from "./CarouselArrow";

interface CarouselProps {
  slides: ReactNode[];
  /** Called when Next is pressed/swiped past the last slide. If omitted, Next is disabled on the last slide. */
  onFinish?: () => void;
  /** Subtle skip control, top-right. Omit to hide it entirely. */
  onSkip?: () => void;
  onIndexChange?: (i: number) => void;
  /** Change this value to force the carousel back to slide 0 (e.g. re-opening the overlay). */
  resetKey?: unknown;
  finishLabel?: string;
  className?: string;
  /** Recolors the arrows/dots in plum for use over the home page's multi-panel feature carousel. */
  dark?: boolean;
  /**
   * Reserves this many px of clear space at the bottom of every slide for
   * the dots/counter indicator, so a slide's own bottom-most content can
   * never sit underneath it. Opt-in (default 0 = unchanged) — only usages
   * with little vertical headroom (see About.tsx) need it; fullscreen
   * carousels already have plenty of room without it.
   */
  indicatorGutter?: number;
}

export default function Carousel({
  slides,
  onFinish,
  onSkip,
  onIndexChange,
  resetKey,
  finishLabel = "Next",
  className,
  dark = false,
  indicatorGutter = 0,
}: CarouselProps) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const intentRef = useRef<"none" | "horizontal" | "vertical">("none");
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setDragPx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const goTo = (next: number) => {
    const clamped = Math.min(total - 1, Math.max(0, next));
    setIndex(clamped);
    setDragPx(0);
    onIndexChange?.(clamped);
  };

  const goNext = () => {
    if (index === total - 1) {
      if (onFinish) onFinish();
      else setDragPx(0);
      return;
    }
    goTo(index + 1);
  };
  const goBack = () => goTo(index - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    intentRef.current = "none";
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (intentRef.current === "none" && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      intentRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (intentRef.current !== "horizontal") return;
    const atStart = index === 0 && dx > 0;
    const atEnd = index === total - 1 && dx < 0 && !onFinish;
    setDragPx(atStart || atEnd ? dx * 0.35 : dx);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const width = viewportRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(110, width * 0.16);
    if (intentRef.current === "horizontal") {
      if (dragPx <= -threshold) goNext();
      else if (dragPx >= threshold) goBack();
      else setDragPx(0);
    } else {
      setDragPx(0);
    }
    intentRef.current = "none";
  };

  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className={`relative ${className ?? ""}`}>
      {onSkip && (
        <button
          onClick={onSkip}
          aria-label="Skip"
          className="absolute right-4 top-4 z-20 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink-soft sm:right-6 sm:top-6"
        >
          Skip
        </button>
      )}

      {/* Previous/Next flank the slide viewport as real flex siblings (lg+) — never an overlay
          on top of slide content. Below lg there isn't reliably enough spare width to flank
          without squeezing the slide (and on some pages a fixed right-edge widget lives right
          where a flanking control would), so tablet/mobile fall back to inline icons next to
          the dots instead (see the indicator row) — the "navigation row below" the spec calls
          for on narrower viewports. */}
      <div className="flex h-full items-center gap-3">
        <CarouselArrow
          direction="prev"
          onClick={goBack}
          disabled={isFirst}
          label="Previous slide"
          text="Previous"
          className="hidden shrink-0 lg:inline-flex"
        />

        <div
          ref={viewportRef}
          className="relative h-full min-w-0 flex-1 touch-none select-none overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="flex h-full"
            style={{
              width: `${total * 100}%`,
              transform: `translateX(calc(${(-index * 100) / total}% + ${dragPx}px))`,
              transition: dragging.current ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {slides.map((slide, i) => (
              <div key={i} className="h-full shrink-0" style={{ width: `${100 / total}%`, paddingBottom: indicatorGutter || undefined }}>
                {slide}
              </div>
            ))}
          </div>
        </div>

        <CarouselArrow
          direction="next"
          onClick={goNext}
          disabled={isLast && !onFinish}
          label="Next slide"
          text={isLast ? finishLabel : "Next"}
          className="hidden shrink-0 lg:inline-flex"
        />
      </div>

      {/* indicator: prev/next (mobile only) + dots + counter, bottom center — always below/beside
          the slide, never over it */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 sm:bottom-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <CarouselArrow direction="prev" onClick={goBack} disabled={isFirst} label="Previous slide" className="inline-flex lg:hidden" />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="group flex h-6 items-center px-0.5"
              >
                <span
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === index
                      ? dark
                        ? "w-6 bg-[#faf4ea]"
                        : "w-6 bg-ink"
                      : dark
                        ? "w-3 bg-[#faf4ea]/25 group-hover:bg-[#faf4ea]/45"
                        : "w-3 bg-ink/25 group-hover:bg-ink/40"
                  }`}
                />
              </button>
            ))}
          </div>
          <CarouselArrow
            direction="next"
            onClick={goNext}
            disabled={isLast && !onFinish}
            label="Next slide"
            className="inline-flex lg:hidden"
          />
        </div>
        <p className={`text-[10.5px] uppercase tracking-[0.2em] ${dark ? "text-[#faf4ea]/45" : "text-ink-faint"}`}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
