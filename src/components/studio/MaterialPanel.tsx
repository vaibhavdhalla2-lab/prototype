import { materialsFor } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconSparkle } from "../icons";

function Bars({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-3.5 rounded-full ${i <= value ? "bg-ink" : "bg-line"}`} />
      ))}
    </div>
  );
}

export default function MaterialPanel({ onOpenMuse }: { onOpenMuse: () => void }) {
  const design = useDesign();
  if (!design.garment) return null;
  const materials = materialsFor(design.garment);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Choose your material</p>
          <p className="mt-1 text-sm text-ink-soft">Not sure what works? That's what MUSE is here for.</p>
        </div>
      </div>

      <button
        onClick={onOpenMuse}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-clay/35 bg-clay/[0.06] px-4 py-3 text-left transition-colors hover:border-clay/60"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium text-clay-deep">
          <IconSparkle className="h-4 w-4" />
          Ask MUSE what to use
        </span>
        <span className="text-[11px] uppercase tracking-[0.1em] text-clay-deep/70">Open</span>
      </button>

      <div className="mt-5 space-y-3">
        {materials.map((m) => {
          const isActive = m.id === design.material;
          return (
            <button
              key={m.id}
              onClick={() => {
                design.setMaterial(m.id);
                track("material_changed", { material: m.id });
              }}
              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                isActive ? "border-ink bg-ivory-dim shadow-[0_10px_26px_-18px_rgba(26,23,18,0.5)]" : "border-line hover:border-ink-soft"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">{m.label}</p>
                <span className="text-xs font-medium text-ink-faint">{m.priceTier}</span>
              </div>
              <p className="mt-1 text-[13px] text-ink-soft">{m.tagline}</p>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11.5px] text-ink-faint">
                <div className="min-w-0">
                  <p className="uppercase tracking-[0.08em]">Best for</p>
                  <p className="mt-0.5 text-ink-soft">{m.bestFor}</p>
                </div>
                <div className="min-w-0">
                  <p className="uppercase tracking-[0.08em]">Feel</p>
                  <p className="mt-0.5 text-ink-soft">{m.feel}</p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="mb-1 uppercase tracking-[0.08em]">Breathability</p>
                  <Bars value={m.breathability} />
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="mb-1 uppercase tracking-[0.08em]">Durability</p>
                  <Bars value={m.durability} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
