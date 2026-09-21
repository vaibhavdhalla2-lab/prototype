import { COLORS } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";

/**
 * The product's physical colour picker — shown centered directly beneath the
 * main product preview, since colour is a core physical choice about the
 * object itself, not a settings-panel afterthought. Deliberately lightweight:
 * just the current colour name and a row of small swatches, no card around it.
 *
 * This is the PRODUCT's base colour only — separate from (and never a
 * substitute for) the Draw/Text/Graphics tools' own colour controls, which
 * stay inside their respective panels.
 */
export default function ColorSwatchRow() {
  const design = useDesign();
  const active = COLORS.find((c) => c.id === design.color)!;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[12px] font-medium text-ink">{active.label}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {COLORS.map((c) => {
          const isActive = c.id === design.color;
          return (
            <button
              key={c.id}
              onClick={() => {
                design.setColor(c.id);
                track("color_changed", { color: c.id });
              }}
              title={c.label}
              aria-label={c.label}
              className={`h-6 w-6 rounded-full border transition-all duration-200 ${
                isActive ? "scale-110 border-[#c8a96b] shadow-[0_0_0_2px_rgba(200,169,107,0.35)]" : "border-line-soft hover:scale-105 hover:border-ink-soft"
              }`}
              style={{ background: c.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
