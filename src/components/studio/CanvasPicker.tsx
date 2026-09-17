import { GARMENTS, COLORS } from "../../data/catalog";
import type { GarmentType } from "../../data/catalog";
import { GarmentStage } from "../Garment";
import { IconArrowRight, IconLock } from "../icons";

export default function CanvasPicker({ onSelect }: { onSelect: (g: GarmentType) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">Step 1</p>
      <h1 className="text-center font-display text-4xl text-ink sm:text-5xl animate-fade-up [animation-delay:60ms]">
        Choose your canvas
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-ink-soft animate-fade-up [animation-delay:120ms]">
        Start with a blank canvas. We'll help you turn your imagination into something real.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {GARMENTS.map((g, i) => (
          <button
            key={g.id}
            onClick={() => g.available && onSelect(g.id)}
            aria-disabled={!g.available}
            style={{ animationDelay: `${180 + i * 80}ms` }}
            className={`group relative flex flex-col items-center overflow-hidden rounded-3xl border p-6 text-center transition-all duration-300 animate-fade-up ${
              g.available
                ? "border-line bg-paper hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-[0_24px_60px_-24px_rgba(26,23,18,0.35)] cursor-pointer"
                : "border-line-soft bg-ivory-dim cursor-default"
            }`}
          >
            <div className={`flex h-44 w-full items-center justify-center ${g.available ? "" : "opacity-45 grayscale"}`}>
              <GarmentStage garment={g.id} colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
            </div>

            {!g.available && (
              <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory">
                <IconLock className="h-3 w-3" />
                Coming Soon
              </span>
            )}

            <h3 className={`mt-4 font-display text-2xl ${g.available ? "text-ink" : "text-ink-soft"}`}>{g.label}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{g.blurb}</p>

            {g.available ? (
              <>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink-faint">From ₹{g.basePrice.toLocaleString("en-IN")}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink opacity-0 transition-opacity group-hover:opacity-100">
                  Select
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </>
            ) : (
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink-faint">More ways to wear it, soon</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
