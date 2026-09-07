import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { IconSparkle, IconUpload, IconCheck } from "../icons";

type Phase = "reference" | "uploading" | "analyzing" | "result" | "applied";

export default function SlideUpload({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("reference");

  useEffect(() => {
    if (!active) {
      setPhase("reference");
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase("uploading"), 500),
      window.setTimeout(() => setPhase("analyzing"), 1200),
      window.setTimeout(() => setPhase("result"), 2200),
      window.setTimeout(() => setPhase("applied"), 3400),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  const applied = phase === "applied";
  const inStudio = phase === "result" || applied;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-14 sm:px-14 sm:py-16">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        Have something in mind? Show us.
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2.1rem,7vw,3.6rem)] leading-[1.02] tracking-tight text-ink [animation-delay:140ms]">
        Bring your inspiration.
      </h1>
      <p className="animate-fade-up mt-2 max-w-sm text-center text-[14.5px] leading-relaxed text-ink-soft [animation-delay:200ms]">
        See something you love? Upload it — we'll help turn the idea into something you can wear.
      </p>

      <div className="mt-7 flex w-full max-w-sm items-center gap-5">
        {/* reference image card -> transitions into the studio garment */}
        <div className="relative aspect-square w-[40%] shrink-0 overflow-hidden rounded-2xl border border-line-soft bg-paper shadow-[0_20px_50px_-30px_rgba(26,23,18,0.35)]">
          {!inStudio ? (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 p-3"
              style={{ background: "linear-gradient(150deg, #2a2622 0%, #4a3f33 55%, #6b4a34 100%)" }}
            >
              <span className="text-[9px] uppercase tracking-[0.14em] text-ivory/60">Reference</span>
              <div className="h-10 w-10 rounded-full border-2 border-ivory/40" />
              <span className="text-[8.5px] text-ivory/50">streetwear hoodie</span>
            </div>
          ) : (
            <div className="h-full w-full p-3 animate-fade-in">
              <GarmentStage garment="hoodie" colorHex={applied ? "#17140f" : "#3a322a"} view="front" fit={applied ? "oversized" : "regular"} className="h-full w-full" />
            </div>
          )}
          {phase === "uploading" && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ivory animate-pulse">
              <IconUpload className="h-3 w-3" />
            </span>
          )}
        </div>

        <div className="flex-1">
          {phase === "reference" && <p className="text-[13px] text-ink-faint">A hoodie you found and loved…</p>}
          {phase === "uploading" && <p className="text-[13px] text-ink-faint animate-fade-in">Uploading to FORMÉ…</p>}
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
          {(phase === "result" || applied) && (
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

      <div className={`mt-5 grid grid-cols-3 gap-2 transition-opacity duration-500 ${inStudio ? "opacity-100" : "opacity-0"}`}>
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
        <IconCheck className="h-3.5 w-3.5 text-clay-deep" /> Applied — your garment is ready to refine
      </div>

      <p className="mt-6 max-w-sm text-center font-display text-lg italic leading-snug text-ink">
        "Upload it. Remix it. Make it yours."
      </p>
      <p className="mt-1.5 max-w-xs text-center text-[12.5px] text-ink-faint">
        You don't need to know how to design it — just show us what you like.
      </p>
    </div>
  );
}
