import { fitsFor } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";

export default function FitPanel() {
  const design = useDesign();
  if (!design.garment) return null;
  const fits = fitsFor(design.garment);

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Choose your fit</p>

      <div className="mt-4 space-y-2.5">
        {fits.map((f) => {
          const isActive = f.id === design.fit;
          return (
            <button
              key={f.id}
              onClick={() => {
                design.setFit(f.id);
                track("changed_fit", { fit: f.id });
              }}
              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                isActive ? "border-ink bg-ivory-dim" : "border-line hover:border-ink-soft"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">{f.label}</p>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    isActive ? "border-ink bg-ink" : "border-line"
                  }`}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-ivory" />}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{f.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
