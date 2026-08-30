import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { IconArrowRight, IconRemix } from "../icons";

type Phase = "creation" | "publishing" | "live";

const CARDS = [
  { name: "AFTER DARK", creator: "maya", price: "₹2,199", garment: "tshirt" as const, hex: "#5a2331" },
  { name: "VOID / 01", creator: "aarav", price: "₹2,499", garment: "hoodie" as const, hex: "#232d3f" },
];

export default function SlideMarketplace({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("creation");

  useEffect(() => {
    if (!active) {
      setPhase("creation");
      return;
    }
    const timers = [window.setTimeout(() => setPhase("publishing"), 650), window.setTimeout(() => setPhase("live"), 1500)];
    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  const live = phase === "live";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-14 sm:px-14 sm:py-16">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        Create. Share. Earn.
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(1.9rem,6.5vw,3.1rem)] leading-[1.02] tracking-tight text-ink [animation-delay:140ms]">
        Create something.
        <br />
        Put it out there.
      </h1>
      <p className="animate-fade-up mt-2 max-w-xs text-center text-[13.5px] text-ink-soft [animation-delay:200ms]">
        Share your creation with the world. If people love it, they can wear it too.
      </p>

      <div className="relative mt-6 flex h-[150px] w-full max-w-sm items-center justify-center">
        <div
          className="absolute flex flex-col items-center transition-all duration-500"
          style={{ opacity: live ? 0 : 1, transform: phase === "publishing" ? "scale(0.85) translateY(-6px)" : "scale(1)", pointerEvents: "none" }}
        >
          <div className="aspect-square w-24 rounded-2xl border border-line-soft bg-paper p-3 shadow-[0_16px_40px_-24px_rgba(26,23,18,0.4)]">
            <GarmentStage garment="hoodie" colorHex="#17140f" view="front" className="h-full w-full" />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint">Your creation</p>
          {phase === "publishing" && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-clay-deep animate-fade-in">
              Publishing <IconArrowRight className="h-3 w-3" />
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 transition-all duration-500" style={{ opacity: live ? 1 : 0, transform: live ? "translateY(0)" : "translateY(10px)" }}>
          {CARDS.map((c) => (
            <div key={c.name} className="w-32 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_16px_40px_-26px_rgba(26,23,18,0.4)]">
              <div className="flex aspect-square items-center justify-center p-3" style={{ background: `${c.hex}12` }}>
                <GarmentStage garment={c.garment} colorHex={c.hex} view="front" className="h-full w-full" />
              </div>
              <div className="p-2.5">
                <p className="font-display text-[13px] leading-tight text-ink">{c.name}</p>
                <p className="text-[10px] text-ink-faint">@{c.creator}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-ink">{c.price}</span>
                  <span className="flex items-center gap-0.5 rounded-full border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-[0.04em] text-ink-soft">
                    <IconRemix className="h-2.5 w-2.5" /> Remix
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-3 flex flex-wrap items-center justify-center gap-2.5 transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3 rounded-2xl border border-clay/30 bg-clay/[0.07] px-4 py-2.5">
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-clay-deep">Creator reward</p>
            <p className="font-display text-xl leading-none text-ink">10%</p>
          </div>
          <p className="max-w-[130px] text-[9.5px] leading-snug text-ink-faint">Illustrative — subject to final FORMÉ terms.</p>
        </div>
      </div>

      <div className={`mt-4 flex flex-col items-center gap-1 transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}>
        <p className="text-[12.5px] text-ink-soft">Found something you love?</p>
        <p className="font-display text-base italic text-ink">Make it yours.</p>
      </div>
    </div>
  );
}
