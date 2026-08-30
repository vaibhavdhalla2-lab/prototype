import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../lib/onboarding";
import { track } from "../../lib/analytics";
import { IconArrowRight, IconClose } from "../icons";
import SlideImagine from "./SlideImagine";
import SlideMuse from "./SlideMuse";
import SlideMarket from "./SlideMarket";
import SlideDiscover from "./SlideDiscover";
import FinalScreen from "./FinalScreen";

const TOTAL_CONTENT_SLIDES = 4;
const TOTAL_STEPS = TOTAL_CONTENT_SLIDES + 1; // + final screen

export default function Onboarding() {
  const { isOpen, close, complete } = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const intentRef = useRef<"none" | "horizontal" | "vertical">("none");
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDragPx(0);
      track("landing_view", { onboarding: "opened" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const goTo = useCallback((next: number) => {
    setStep(Math.min(TOTAL_STEPS - 1, Math.max(0, next)));
    setDragPx(0);
  }, []);

  const goNext = useCallback(() => goTo(step + 1), [goTo, step]);
  const goBack = useCallback(() => goTo(step - 1), [goTo, step]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goBack();
      else if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  const handleSkip = () => {
    track("landing_view", { onboarding: "skipped", step });
    close();
    navigate("/");
  };

  const finish = (destination: "create" | "marketplace" | "scratch") => {
    track("start_creating", { onboarding: "completed", destination });
    complete();
    if (destination === "marketplace") navigate("/marketplace");
    else if (destination === "scratch") navigate("/create", { state: { mode: "scratch" } });
    else navigate("/create");
  };

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
    // resist dragging past the first/last slide
    const atStart = step === 0 && dx > 0;
    const atEnd = step === TOTAL_STEPS - 1 && dx < 0;
    setDragPx(atStart || atEnd ? dx * 0.35 : dx);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const width = viewportRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(120, width * 0.18);
    if (intentRef.current === "horizontal") {
      if (dragPx <= -threshold) goNext();
      else if (dragPx >= threshold) goBack();
      else setDragPx(0);
    } else {
      setDragPx(0);
    }
    intentRef.current = "none";
  };

  if (!isOpen) return null;

  const slides = [
    <SlideImagine key="1" active={step === 0} />,
    <SlideMuse key="2" active={step === 1} />,
    <SlideMarket key="3" active={step === 2} />,
    <SlideDiscover key="4" active={step === 3} onRemix={() => finish("create")} />,
  ];
  const onFinalScreen = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-ivory animate-fade-in" role="dialog" aria-modal="true" aria-label="Welcome to FORMÉ">
      <div className="grain absolute inset-0 opacity-60" />

      {!onFinalScreen && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] sm:px-8">
            <div className="pointer-events-auto flex items-center gap-1.5">
              {Array.from({ length: TOTAL_CONTENT_SLIDES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="group flex h-6 items-center px-0.5"
                >
                  <span className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-ink" : "w-3 bg-ink/25 group-hover:bg-ink/40"}`} />
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              aria-label="Skip onboarding"
              className="pointer-events-auto text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink-soft"
            >
              Skip
            </button>
          </div>
        </>
      )}

      <div
        ref={viewportRef}
        className="relative h-full w-full touch-none select-none overflow-hidden"
        onPointerDown={onFinalScreen ? undefined : onPointerDown}
        onPointerMove={onFinalScreen ? undefined : onPointerMove}
        onPointerUp={onFinalScreen ? undefined : onPointerUp}
        onPointerLeave={onFinalScreen ? undefined : onPointerUp}
      >
        <div
          className="flex h-full"
          style={{
            width: `${TOTAL_STEPS * 100}%`,
            transform: `translateX(calc(${(-step * 100) / TOTAL_STEPS}% + ${dragPx}px))`,
            transition: dragging.current ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="h-full shrink-0" style={{ width: `${100 / TOTAL_STEPS}%` }}>
              {slide}
            </div>
          ))}
          <div className="h-full shrink-0" style={{ width: `${100 / TOTAL_STEPS}%` }}>
            <FinalScreen
              active={onFinalScreen}
              onStartCreating={() => finish("create")}
              onExploreMarketplace={() => finish("marketplace")}
              onStartFromScratch={() => finish("scratch")}
            />
          </div>
        </div>
      </div>

      {!onFinalScreen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-8">
          <p className="pointer-events-none text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            {String(step + 1).padStart(2, "0")} / {String(TOTAL_CONTENT_SLIDES).padStart(2, "0")}
          </p>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="pointer-events-auto group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory shadow-[0_16px_40px_-16px_rgba(26,23,18,0.55)] transition-transform hover:-translate-y-0.5"
          >
            Next
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {onFinalScreen && (
        <button
          onClick={handleSkip}
          aria-label="Close"
          className="absolute right-5 top-[max(16px,env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:text-ink sm:right-8"
        >
          <IconClose className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
