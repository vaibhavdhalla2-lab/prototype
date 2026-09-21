import { useDesign } from "../../lib/store";
import { variantGroupsFor, isApparel } from "../../data/products";
import { track } from "../../lib/analytics";

/**
 * The generic variant-group tab for every non-apparel product — apparel keeps
 * its own Material/Fit panels (they carry breathability/durability bars and
 * fit silhouettes that don't map onto a mug's size or a poster's frame).
 * Each product's own variant schema (data/products.ts) drives what shows up
 * here. `groupKeys`, when passed, scopes this instance to just those groups
 * (e.g. Mug's "Finish" tab shows only the finish group) so the left sidebar
 * can present object-specific sections instead of one catch-all tab.
 */
export default function OptionsPanel({ groupKeys, title, subtitle }: { groupKeys?: string[]; title?: string; subtitle?: string }) {
  const design = useDesign();
  if (!design.garment || isApparel(design.garment)) return null;
  const groups = variantGroupsFor(design.garment).filter((g) => !groupKeys || groupKeys.includes(g.key));

  return (
    <div className="animate-fade-in space-y-7">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">{title ?? "Product options"}</p>
        <p className="mt-1 text-sm text-ink-soft">{subtitle ?? "Every choice below updates the preview instantly."}</p>
      </div>

      {groups.map((group) => {
        const active = design.variants[group.key] ?? group.options[0].id;
        return (
          <div key={group.key}>
            <p className="mb-3 text-[13px] font-medium text-ink">{group.label}</p>
            <div className="space-y-2.5">
              {group.options.map((opt) => {
                const isActive = opt.id === active;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      design.setVariant(group.key, opt.id);
                      track("material_changed", { variant: group.key, value: opt.id });
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                      isActive ? "border-ink bg-ivory-dim shadow-[0_10px_26px_-18px_rgba(26,23,18,0.5)]" : "border-line hover:border-ink-soft"
                    }`}
                  >
                    <span>
                      <span className="flex items-center gap-2">
                        {opt.hex && <span className="h-4 w-4 shrink-0 rounded-full border border-line-soft" style={{ background: opt.hex }} />}
                        <span className="font-display text-base text-ink">{opt.label}</span>
                      </span>
                      {opt.description && <span className="mt-0.5 block text-[12.5px] text-ink-soft">{opt.description}</span>}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {typeof opt.priceImpact === "number" && opt.priceImpact !== 0 && (
                        <span className="text-[11px] font-medium text-ink-faint">
                          {opt.priceImpact > 0 ? "+" : ""}₹{opt.priceImpact.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                          isActive ? "border-ink bg-ink" : "border-line"
                        }`}
                      >
                        {isActive && <span className="h-2 w-2 rounded-full bg-ivory" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
