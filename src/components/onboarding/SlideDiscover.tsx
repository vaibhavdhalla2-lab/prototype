import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { MARKET_DESIGNS } from "../../data/marketplace";
import { colorById } from "../../data/catalog";
import { IconArrowRight, IconRemix } from "../icons";

const FEATURED_IDS = ["after-dark", "midnight-tokyo", "field-notes", "burgundy-line", "silver-circuit", "dead-stock"];
const FEATURED = FEATURED_IDS.map((id) => MARKET_DESIGNS.find((d) => d.id === id)!).filter(Boolean);

export default function SlideDiscover({ active, onRemix }: { active: boolean; onRemix: () => void }) {
  const [remixing, setRemixing] = useState(false);
  const featured = FEATURED[0];

  useEffect(() => {
    if (!active) setRemixing(false);
  }, [active]);

  const handleRemix = () => {
    setRemixing(true);
    window.setTimeout(onRemix, 550);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-24 pt-20 sm:px-10">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        Discovery. Social. Remix.
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2rem,7vw,3.4rem)] leading-[1.02] tracking-tight text-ink [animation-delay:140ms]">
        Don't just shop.
        <br />
        Discover.
      </h1>
      <p className="animate-fade-up mt-2 text-center text-[14px] text-ink-soft [animation-delay:200ms]">
        Explore pieces created by people like you.
      </p>

      <div className="mt-6 w-full max-w-md overflow-x-auto">
        <div className="flex w-max gap-3 px-1 pb-1">
          {FEATURED.map((d, i) => (
            <div
              key={d.id}
              className={`w-24 shrink-0 overflow-hidden rounded-2xl border bg-paper transition-all duration-300 ${
                i === 0 ? "border-ink shadow-[0_16px_36px_-22px_rgba(26,23,18,0.45)]" : "border-line-soft opacity-80"
              }`}
            >
              <div className="flex aspect-square items-center justify-center p-2.5" style={{ background: `${d.accent}14` }}>
                <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
              </div>
              <div className="px-2 pb-2">
                <p className="truncate text-[10.5px] font-medium text-ink">{d.name}</p>
                <p className="truncate text-[9px] text-ink-faint">@{d.creator}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-[13px] text-ink-soft">Found something you love?</p>
        <button
          onClick={handleRemix}
          disabled={remixing}
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {remixing ? (
            <>Opening "{featured.name}"…</>
          ) : (
            <>
              <IconRemix className="h-3.5 w-3.5" /> Remix This
            </>
          )}
        </button>
        <p className="font-display text-base italic text-ink">Make it yours.</p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
      </div>
    </div>
  );
}
