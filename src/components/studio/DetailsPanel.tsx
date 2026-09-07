import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";

const TRIM_LABEL: Record<string, { on: string; off: string }> = {
  tshirt: { on: "Contrast collar rib", off: "Tonal collar rib" },
  hoodie: { on: "Contrast drawcords", off: "Tonal drawcords" },
  cap: { on: "Contrast button", off: "Tonal button" },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-line"}`}
      aria-label="Toggle"
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-ivory shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function DetailsPanel() {
  const design = useDesign();
  if (!design.garment) return null;
  const labels = TRIM_LABEL[design.garment];

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Construction details</p>
      <p className="mt-1 text-sm text-ink-soft">Small touches that change how considered the piece feels.</p>

      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg text-ink">Stitching</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">{design.accentTrim ? labels.on : labels.off}</p>
          </div>
          <Toggle on={design.accentTrim} onChange={design.setAccentTrim} />
        </div>
      </div>

      {design.garment === "hoodie" && (
        <div className="mt-3 rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg text-ink">Kangaroo pocket</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">{design.pocketVisible ? "Front pocket, standard construction" : "Clean front, no pocket"}</p>
            </div>
            <Toggle on={design.pocketVisible} onChange={design.setPocketVisible} />
          </div>
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-line p-4">
        <p className="font-display text-lg text-ink">Graphic finish</p>
        <p className="mt-0.5 mb-3 text-[13px] text-ink-soft">How drawings, text and uploaded artwork are applied.</p>
        <div className="flex gap-2">
          {(["print", "embroidery"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                design.setFinish(f);
                track("material_changed", { finish: f });
              }}
              className={`flex-1 rounded-xl border py-2.5 text-[12px] uppercase tracking-[0.08em] transition-colors ${
                design.finish === f ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">
          {design.finish === "print"
            ? "A flat, direct print — crisp for detailed graphics and photography."
            : "Raised thread with subtle depth — best for simple shapes and lettering."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-line-soft bg-ivory-dim p-4 text-[13px] leading-relaxed text-ink-soft">
        A tonal trim disappears into the garment for a clean, minimal read. A contrast trim in warm clay adds a
        small, deliberate detail — the kind of thing that reads as considered rather than decorated.
      </div>
    </div>
  );
}
