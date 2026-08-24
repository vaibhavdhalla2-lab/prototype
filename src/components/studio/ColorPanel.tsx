import { COLORS } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconCheck } from "../icons";

export default function ColorPanel() {
  const design = useDesign();
  const active = COLORS.find((c) => c.id === design.color)!;

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Choose your colour</p>

      <div className="mt-4 grid grid-cols-4 gap-3.5 sm:grid-cols-5">
        {COLORS.map((c) => {
          const isActive = c.id === design.color;
          return (
            <button
              key={c.id}
              onClick={() => {
                design.setColor(c.id);
                track("changed_color", { color: c.id });
              }}
              className="group flex flex-col items-center gap-2"
              aria-label={c.label}
            >
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
                  isActive ? "scale-110 border-ink shadow-[0_6px_18px_-6px_rgba(26,23,18,0.5)]" : "border-line-soft hover:scale-105 hover:border-ink-soft"
                }`}
                style={{ background: c.hex }}
              >
                {isActive && (
                  <IconCheck
                    className="h-4 w-4"
                    style={{ color: ["offwhite", "stone"].includes(c.id) ? "#1a1712" : "#f6f3ec" }}
                  />
                )}
              </span>
              <span className={`text-[10.5px] uppercase tracking-[0.06em] transition-colors ${isActive ? "text-ink" : "text-ink-faint"}`}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      <div key={active.id} className="mt-7 animate-fade-up rounded-2xl border border-line-soft bg-ivory-dim p-5">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 shrink-0 rounded-full border border-line" style={{ background: active.hex }} />
          <p className="font-display text-lg text-ink">{active.label}</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{active.description}</p>
      </div>
    </div>
  );
}
