import { useDesign } from "../../lib/store";
import { variantGroupsFor, isApparel } from "../../data/products";
import { track } from "../../lib/analytics";
import { IconCheck } from "../icons";

/** Groups the phone case's flat model list by brand, inferred from the label — no separate data model needed for a handful of options. */
function brandOf(label: string): string {
  if (/iphone/i.test(label)) return "Apple";
  if (/galaxy/i.test(label)) return "Samsung";
  if (/pixel/i.test(label)) return "Google";
  return "Other";
}

/**
 * The phone case's most important control, surfaced first and on its own —
 * not buried inside Material/Details. Changing the device updates the case
 * silhouette, camera cutout and safe zone (via the shared `model` variant),
 * exactly like any other variant choice, just given top billing here.
 */
export default function DeviceSelector() {
  const design = useDesign();
  if (!design.garment || isApparel(design.garment)) return null;
  const modelGroup = variantGroupsFor(design.garment).find((g) => g.key === "model");
  if (!modelGroup) return null;

  const brands = Array.from(new Set(modelGroup.options.map((o) => brandOf(o.label))));
  const activeModel = design.variants.model ?? modelGroup.options[0].id;
  const activeBrand = brandOf(modelGroup.options.find((o) => o.id === activeModel)?.label ?? "");

  const setModel = (id: string) => {
    design.setVariant("model", id);
    track("material_changed", { variant: "model", value: id });
  };

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Your device</p>
      <p className="mt-1 text-sm text-ink-soft">The case shape, camera cutout and safe zone all adapt to your phone.</p>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">Brand</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {brands.map((b) => {
          const isActive = b === activeBrand;
          const firstOfBrand = modelGroup.options.find((o) => brandOf(o.label) === b)!;
          return (
            <button
              key={b}
              onClick={() => setModel(firstOfBrand.id)}
              className={`rounded-full border px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors ${
                isActive ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-ink-soft"
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">Model</p>
      <div className="mt-2 space-y-2">
        {modelGroup.options
          .filter((o) => brandOf(o.label) === activeBrand)
          .map((opt) => {
            const isActive = opt.id === activeModel;
            return (
              <button
                key={opt.id}
                onClick={() => setModel(opt.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  isActive ? "border-ink bg-ivory-dim shadow-[0_10px_26px_-18px_rgba(26,23,18,0.5)]" : "border-line hover:border-ink-soft"
                }`}
              >
                {/* tiny phone silhouette so the model list doesn't read as plain text rows */}
                <span className="flex h-9 w-6 shrink-0 items-center justify-center rounded-[7px] border border-line-soft bg-paper">
                  <span className="h-6 w-4 rounded-[4px] border border-ink-faint/40" />
                </span>
                <span className="flex-1 font-display text-base text-ink">{opt.label}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isActive ? "border-ink bg-ink" : "border-line"}`}>
                  {isActive && <IconCheck className="h-3 w-3 text-ivory" />}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
