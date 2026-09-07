import { GARMENTS, COLORS } from "../../data/catalog";
import type { GarmentType } from "../../data/catalog";
import { GarmentStage } from "../Garment";
import { IconArrowRight } from "../icons";

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
            onClick={() => onSelect(g.id)}
            style={{ animationDelay: `${180 + i * 80}ms` }}
            className="group flex flex-col items-center rounded-3xl border border-line bg-paper p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-[0_24px_60px_-24px_rgba(26,23,18,0.35)] animate-fade-up"
          >
            <div className="flex h-44 w-full items-center justify-center">
              <GarmentStage garment={g.id} colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
            </div>
            <h3 className="mt-4 font-display text-2xl text-ink">{g.label}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{g.blurb}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink-faint">From ₹{g.basePrice.toLocaleString("en-IN")}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink opacity-0 transition-opacity group-hover:opacity-100">
              Select
              <IconArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
