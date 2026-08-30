import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { motifPathD } from "../../lib/motifs";

const DRAW_D = motifPathD("wave", 180, 200, 3.4);
const CHIPS = ["Draw", "Colour", "Fit", "Material"];

function DrawnLine({ show }: { show: boolean }) {
  return (
    <path
      d={DRAW_D}
      fill="none"
      stroke="#1a1712"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      style={{
        strokeDashoffset: show ? 0 : 1,
        transition: show ? "none" : undefined,
        animation: show ? "draw-in 1.5s 0.5s cubic-bezier(0.65,0,0.35,1) both" : "none",
      }}
    />
  );
}

export default function SlideImagine({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"blank" | "drawing" | "done">("blank");

  useEffect(() => {
    if (!active) {
      setPhase("blank");
      return;
    }
    const t1 = window.setTimeout(() => setPhase("drawing"), 350);
    const t2 = window.setTimeout(() => setPhase("done"), 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [active]);

  const colorHex = phase === "done" ? "#17140f" : "#f1ead9";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-24 pt-20 sm:px-10">
      <div className="animate-fade-up mb-1 text-center [animation-delay:80ms]">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-faint">You can be your own designer</p>
      </div>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2.4rem,8vw,4rem)] leading-[0.98] tracking-tight text-ink [animation-delay:140ms]">
        Imagine it.
        <br />
        Wear it.
      </h1>

      <div className="relative mt-8 aspect-square w-full max-w-[280px] rounded-[28px] border border-line-soft bg-paper p-7 shadow-[0_30px_70px_-35px_rgba(26,23,18,0.35)] sm:max-w-[320px]">
        <GarmentStage
          garment="hoodie"
          colorHex={colorHex}
          view="front"
          className="h-full w-full"
          frontOverlay={phase !== "blank" ? <DrawnLine show={phase === "drawing" || phase === "done"} /> : undefined}
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {CHIPS.map((c) => (
          <span
            key={c}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-500 ${
              c === "Draw" ? "border-ink bg-ink text-ivory" : "border-line-soft text-ink-faint"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <p className="animate-fade-up mt-7 max-w-xs text-center text-[15px] leading-relaxed text-ink-soft [animation-delay:220ms]">
        Start with a blank canvas. Draw it. Shape it. Make it yours.
      </p>
      <p className="mt-4 text-center font-display text-lg italic text-ink">"Your canvas. Your rules."</p>
      <p className="mt-1.5 max-w-xs text-center text-[12.5px] text-ink-faint">
        You don't have to be a fashion designer. You just have to imagine it.
      </p>
    </div>
  );
}
