import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { IconSparkle, IconUpload, IconCheck } from "../icons";

type Phase = "upload" | "analyzing" | "result" | "applied";

export default function SlideMuse({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("upload");

  useEffect(() => {
    if (!active) {
      setPhase("upload");
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase("analyzing"), 500),
      window.setTimeout(() => setPhase("result"), 1500),
      window.setTimeout(() => setPhase("applied"), 2700),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  const applied = phase === "applied";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-24 pt-20 sm:px-10">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        You don't need to know how
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2rem,7vw,3.4rem)] leading-[1.02] tracking-tight text-ink [animation-delay:140ms]">
        Have something in mind?
      </h1>
      <p className="animate-fade-up mt-2 text-center text-[15px] text-ink-soft [animation-delay:200ms]">
        Show us. Tell us. We'll help you shape it.
      </p>

      <div className="mt-7 flex w-full max-w-sm items-center gap-4">
        <div className="relative aspect-square w-[38%] shrink-0 rounded-2xl border border-line-soft bg-paper p-4 shadow-[0_20px_50px_-30px_rgba(26,23,18,0.35)]">
          <GarmentStage garment="tshirt" colorHex={applied || phase === "result" ? "#17140f" : "#f1ead9"} view="front" fit={applied ? "oversized" : "regular"} className="h-full w-full" />
          {(phase === "upload" || phase === "analyzing") && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ivory">
              <IconUpload className="h-3 w-3" />
            </span>
          )}
        </div>

        <div className="flex-1">
          {phase === "upload" && <p className="text-[13px] text-ink-faint">Reference image received…</p>}
          {phase === "analyzing" && (
            <div className="flex items-center gap-2 text-[13px] text-ink-faint animate-fade-in">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:300ms]" />
              </span>
              MUSE is analysing
            </div>
          )}
          {(phase === "result" || phase === "applied") && (
            <div className="animate-fade-up rounded-2xl border border-clay/30 bg-clay/[0.07] p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-clay-deep">
                <IconSparkle className="h-3 w-3" /> Muse
              </p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-ink-soft">
                I see an oversized silhouette, heavyweight fabric and a minimal graphic.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-5 grid grid-cols-3 gap-2 transition-opacity duration-500 ${phase === "result" || applied ? "opacity-100" : "opacity-0"}`}>
        {[
          { l: "Material", v: "Heavyweight" },
          { l: "Fit", v: "Oversized" },
          { l: "Colour", v: "Washed Black" },
        ].map((f) => (
          <div key={f.l} className="rounded-xl border border-line-soft bg-paper px-3 py-2 text-center">
            <p className="text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">{f.l}</p>
            <p className="mt-0.5 text-[12px] font-medium text-ink">{f.v}</p>
          </div>
        ))}
      </div>

      <div className={`mt-4 flex items-center gap-1.5 text-[12.5px] text-ink transition-opacity duration-500 ${applied ? "opacity-100" : "opacity-0"}`}>
        <IconCheck className="h-3.5 w-3.5 text-clay-deep" /> Applied to your garment
      </div>

      <p className="mt-6 max-w-xs text-center font-display text-lg italic text-ink">
        "Your imagination is the starting point.
        <br />
        MUSE helps you take it further."
      </p>
    </div>
  );
}
