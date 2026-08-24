import { useDesign } from "../../lib/store";

const TRIM_LABEL: Record<string, { on: string; off: string }> = {
  tshirt: { on: "Contrast collar rib", off: "Tonal collar rib" },
  hoodie: { on: "Contrast drawcords", off: "Tonal drawcords" },
  cap: { on: "Contrast button", off: "Tonal button" },
};

export default function DetailsPanel() {
  const design = useDesign();
  if (!design.garment) return null;
  const labels = TRIM_LABEL[design.garment];

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Finishing details</p>
      <p className="mt-1 text-sm text-ink-soft">Small touches that change how considered the piece feels.</p>

      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-ink">Trim accent</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">{design.accentTrim ? labels.on : labels.off}</p>
          </div>
          <button
            onClick={() => design.setAccentTrim(!design.accentTrim)}
            className={`relative h-7 w-12 rounded-full transition-colors ${design.accentTrim ? "bg-ink" : "bg-line"}`}
            aria-label="Toggle trim accent"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-ivory shadow transition-transform ${
                design.accentTrim ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line-soft bg-ivory-dim p-4 text-[13px] leading-relaxed text-ink-soft">
        A tonal trim disappears into the garment for a clean, minimal read. A contrast trim in warm clay adds a
        small, deliberate detail — the kind of thing that reads as considered rather than decorated.
      </div>
    </div>
  );
}
