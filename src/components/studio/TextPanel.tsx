import { useDesign, type TextLayer, type CaseMode, type TextAlign } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconTrash, IconCopy, IconType } from "../icons";

const FONTS = ["Inter", "Playfair Display", "Bebas Neue", "Georgia", "Courier New", "Arial Black"];
const SIZES = [12, 14, 16, 20, 24, 32, 48, 64, 96];
const WEIGHTS: { label: string; value: number }[] = [
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Black", value: 900 },
];
const COLORS = ["#1a1712", "#f1ead9", "#9a6a43", "#c8a96b", "#5a2331", "#232d3f", "#2f3d2e", "#ffffff"];
const ALIGNS: { id: TextAlign; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "right", label: "Right" },
];
const CASES: { id: CaseMode; label: string }[] = [
  { id: "none", label: "Aa" },
  { id: "upper", label: "AA" },
  { id: "lower", label: "aa" },
];

function Slider({ value, min, max, step = 1, onChange, format }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-line accent-[#241f1a]"
      />
      <span className="w-12 shrink-0 text-right text-[11.5px] tabular-nums text-ink-soft">{format ? format(value) : value}</span>
    </div>
  );
}

export default function TextPanel() {
  const design = useDesign();
  if (!design.garment) return null;
  const side = design.view === "back" ? "back" : "front";
  const layers = design.layersFor(side).filter((l): l is TextLayer => l.type === "text");
  const selected = layers.find((l) => l.id === design.selectedLayerId) ?? null;

  const createNew = () => {
    const id = design.addTextLayer(side, { content: "TYPE HERE" });
    track("drawing_started", { side, tool: "text" });
    void id;
  };

  const update = (patch: Partial<TextLayer>) => {
    if (!selected) return;
    design.updateLayer<TextLayer>(selected.id, patch);
  };

  if (!selected) {
    return (
      <div className="animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Text</p>
        <p className="mt-1 text-sm text-ink-soft">Add a word or line, then drag it into place. Every text block is its own layer.</p>

        {layers.length > 0 && (
          <div className="mt-4 space-y-2">
            {layers.map((l) => (
              <button
                key={l.id}
                onClick={() => design.selectLayer(l.id)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-left transition-colors hover:border-ink-soft"
              >
                <IconType className="h-4 w-4 shrink-0 text-ink-faint" />
                <span className="truncate text-sm text-ink">{l.content || "Untitled text"}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={createNew}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#241f1a]"
        >
          + Add Text
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Editing text</p>
        <button onClick={() => design.selectLayer(null)} className="text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
          Done
        </button>
      </div>

      <textarea
        value={selected.content}
        onChange={(e) => update({ content: e.target.value.slice(0, 60) })}
        placeholder="Type here..."
        rows={2}
        className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-[#c8a96b] focus:outline-none"
      />

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Font</p>
        <select
          value={selected.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-sm text-ink focus:border-[#c8a96b] focus:outline-none"
          style={{ fontFamily: selected.fontFamily }}
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Size</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => update({ fontSize: s })}
              className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] transition-colors ${
                selected.fontSize === s ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-ink-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Weight</p>
        <div className="flex flex-wrap gap-1.5">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              onClick={() => update({ fontWeight: w.value })}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                selected.fontWeight === w.value ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-ink-soft"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => update({ fontWeight: selected.fontWeight >= 700 ? 400 : 700 })}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border font-bold transition-colors ${
            selected.fontWeight >= 700 ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
          }`}
        >
          B
        </button>
        <button
          onClick={() => update({ italic: !selected.italic })}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border italic transition-colors ${
            selected.italic ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
          }`}
        >
          I
        </button>
        <button
          onClick={() => update({ underline: !selected.underline })}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border underline transition-colors ${
            selected.underline ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
          }`}
        >
          U
        </button>
        <div className="mx-1 h-6 w-px bg-line" />
        {CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => update({ caseMode: c.id })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[12px] transition-colors ${
              selected.caseMode === c.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Alignment</p>
        <div className="flex gap-1.5">
          {ALIGNS.map((a) => (
            <button
              key={a.id}
              onClick={() => update({ align: a.id })}
              className={`flex-1 rounded-lg border py-2 text-[11.5px] uppercase tracking-[0.06em] transition-colors ${
                selected.align === a.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Letter spacing</p>
        <Slider value={selected.letterSpacing} min={-2} max={12} step={0.5} onChange={(v) => update({ letterSpacing: v })} format={(v) => `${v}px`} />
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Line height</p>
        <Slider value={selected.lineHeight} min={0.8} max={2} step={0.05} onChange={(v) => update({ lineHeight: v })} format={(v) => v.toFixed(2)} />
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Opacity</p>
        <Slider value={Math.round(selected.opacity * 100)} min={10} max={100} onChange={(v) => update({ opacity: v / 100 })} format={(v) => `${v}%`} />
      </div>

      <div>
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Colour</p>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((hex) => (
            <button
              key={hex}
              onClick={() => update({ color: hex })}
              className={`h-7 w-7 rounded-full border transition-transform ${selected.color === hex ? "scale-110 border-ink" : "border-line-soft"}`}
              style={{ background: hex }}
              aria-label={hex}
            />
          ))}
          <input
            type="color"
            value={selected.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-7 w-9 cursor-pointer rounded-md border border-line-soft bg-transparent p-0.5"
            aria-label="Custom colour"
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-line-soft pt-4">
        <button
          onClick={() => design.duplicateLayer(selected.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft"
        >
          <IconCopy className="h-3.5 w-3.5" /> Duplicate
        </button>
        <button
          onClick={() => design.removeLayer(selected.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft"
        >
          <IconTrash className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
