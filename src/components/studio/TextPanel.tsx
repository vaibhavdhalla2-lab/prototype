import { useDesign, type TextPlacement } from "../../lib/store";

const PLACEMENTS: { id: TextPlacement; label: string }[] = [
  { id: "top", label: "Upper chest" },
  { id: "center", label: "Center" },
  { id: "bottom", label: "Lower front" },
];

export default function TextPanel() {
  const design = useDesign();

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Add text</p>
      <p className="mt-1 text-sm text-ink-soft">A short word or line prints cleanly. Keep it intentional.</p>

      <input
        value={design.text?.content ?? ""}
        onChange={(e) => {
          const content = e.target.value.slice(0, 24);
          if (!content) {
            design.setText(null);
          } else {
            design.setText({ content, placement: design.text?.placement ?? "center" });
          }
        }}
        placeholder="e.g. MIDNIGHT"
        className="mt-4 w-full rounded-xl border border-line bg-ivory px-4 py-3 text-sm uppercase tracking-[0.08em] text-ink placeholder:text-ink-faint placeholder:tracking-normal placeholder:normal-case focus:border-ink focus:outline-none"
      />
      <p className="mt-1.5 text-right text-[11px] text-ink-faint">{(design.text?.content ?? "").length}/24</p>

      {design.text && (
        <div className="mt-5">
          <p className="mb-2.5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Placement</p>
          <div className="flex gap-2">
            {PLACEMENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => design.setText({ content: design.text!.content, placement: p.id })}
                className={`flex-1 rounded-xl border py-2.5 text-[12px] transition-colors ${
                  design.text?.placement === p.id ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
