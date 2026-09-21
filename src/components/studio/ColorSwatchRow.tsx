import { COLORS } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";

/**
 * Compact colour picker shown directly under the product selector — colour is a core
 * product choice, not a separate settings tab the user has to go find.
 */
export default function ColorSwatchRow() {
  const design = useDesign();
  const active = COLORS.find((c) => c.id === design.color)!;

  return (
    <div className="mb-5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        Colour <span className="text-ink-soft">· {active.label}</span>
      </p>
      <div className="flex flex-wrap gap-2">
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
