import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { IconArrowRight } from "../icons";

const TOTAL = 4;

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
}

export default function Carousel({ slides, onFinish, onSkip, onIndexChange, resetKey, finishLabel = "Next", className }: CarouselProps) {
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
    const clamped = Math.min(TOTAL - 1, Math.max(0, next));
    setIndex(clamped);
    setDragPx(0);
    onIndexChange?.(clamped);
  };

  const goNext = () => {
    if (index === TOTAL - 1) {
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
    const atEnd = index === TOTAL - 1 && dx < 0 && !onFinish;
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
  const isLast = index === TOTAL - 1;

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

      <div
        ref={viewportRef}
        className="relative h-full w-full touch-none select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="flex h-full"
          style={{
            width: `${TOTAL * 100}%`,
            transform: `translateX(calc(${(-index * 100) / TOTAL}% + ${dragPx}px))`,
            transition: dragging.current ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="h-full shrink-0" style={{ width: `${100 / TOTAL}%` }}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* desktop: labeled prev / next flanking the slide */}
      <button
        onClick={goBack}
        disabled={isFirst}
        aria-label="Previous slide"
        className={`absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft transition-all hover:text-ink sm:flex sm:left-2 ${
          isFirst ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <IconArrowRight className="h-4 w-4 rotate-180" />
        Previous
      </button>
      <button
        onClick={goNext}
        disabled={isLast && !onFinish}
        aria-label="Next slide"
        className={`absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft transition-all hover:text-ink sm:flex sm:right-2 ${
          isLast && !onFinish ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {isLast ? finishLabel : "Next"}
        <IconArrowRight className="h-4 w-4" />
      </button>

      {/* mobile: compact icon-only arrows */}
      <button
        onClick={goBack}
        disabled={isFirst}
        aria-label="Previous slide"
        className={`absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-ink-soft shadow-sm backdrop-blur transition-opacity sm:hidden ${
          isFirst ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <IconArrowRight className="h-4 w-4 rotate-180" />
      </button>
      <button
        onClick={goNext}
        disabled={isLast && !onFinish}
        aria-label="Next slide"
        className={`absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-ink-soft shadow-sm backdrop-blur transition-opacity sm:hidden ${
          isLast && !onFinish ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <IconArrowRight className="h-4 w-4" />
      </button>

      {/* indicator: dots + counter, bottom center */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 sm:bottom-6">
        <div className="pointer-events-auto flex items-center gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group flex h-6 items-center px-0.5"
            >
              <span className={`h-1 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-ink" : "w-3 bg-ink/25 group-hover:bg-ink/40"}`} />
            </button>
          ))}
        </div>
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
          {String(index + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
