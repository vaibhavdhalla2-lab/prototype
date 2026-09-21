import { useDesign, type DrawTool, type SmoothingLevel } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconUndo, IconRedo, IconTrash, IconSparkle, IconCheck, IconPencil, IconMarker, IconBrush, IconPen, IconEraser } from "../icons";

const TOOLS: { id: DrawTool; label: string; icon: typeof IconPencil }[] = [
  { id: "pencil", label: "Pencil", icon: IconPencil },
  { id: "marker", label: "Marker", icon: IconMarker },
  { id: "brush", label: "Brush", icon: IconBrush },
  { id: "pen", label: "Pen", icon: IconPen },
  { id: "eraser", label: "Eraser", icon: IconEraser },
];

const BRUSH_SIZES = [1, 2, 4, 8, 12, 16, 24, 40];
const SMOOTHING: { id: SmoothingLevel; label: string }[] = [
  { id: "none", label: "None" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "strong", label: "Strong" },
];
const PALETTE = ["#1a1712", "#f1ead9", "#9a6a43", "#c8a96b", "#2f3d2e", "#5a2331", "#232d3f", "#ffffff"];

interface DrawPanelProps {
  tool: DrawTool;
  setTool: (t: DrawTool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  opacity: number;
  setOpacity: (n: number) => void;
  smoothing: SmoothingLevel;
  setSmoothing: (s: SmoothingLevel) => void;
  recentColors: string[];
  onRefine?: () => void;
}

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

export default function DrawPanel({ tool, setTool, color, setColor, brushSize, setBrushSize, opacity, setOpacity, smoothing, setSmoothing, recentColors, onRefine }: DrawPanelProps) {
  const design = useDesign();
  const side = design.view === "back" ? "back" : "front";
  const strokes = side === "back" ? design.strokesBack : design.strokesFront;
  const isRefined = side === "back" ? design.refinedBack : design.refinedFront;

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Draw</p>
      <p className="mt-1 text-sm text-ink-soft">Don't overthink it. Draw something only you would wear.</p>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            aria-label={t.label}
            aria-pressed={tool === t.id}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-3 transition-all duration-150 ${
              tool === t.id
                ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]"
                : "border-[#B8A88B]/50 bg-[#FAF3E4] text-[#3a352c] hover:border-[#B8A88B] hover:bg-[#f3e9d4]"
            }`}
          >
            <t.icon className="h-[18px] w-[18px]" />
            <span className="text-[9.5px] font-medium uppercase tracking-[0.04em]">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Brush size</p>
        <Slider value={brushSize} min={1} max={40} onChange={setBrushSize} format={(v) => `${v}px`} />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                brushSize === s ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-[#B8A88B]/50 bg-[#FAF3E4] text-[#3a352c] hover:border-[#B8A88B]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Opacity</p>
        <Slider value={Math.round(opacity * 100)} min={5} max={100} onChange={(v) => setOpacity(v / 100)} format={(v) => `${v}%`} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Smoothing</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SMOOTHING.map((s) => (
            <button
              key={s.id}
              onClick={() => setSmoothing(s.id)}
              className={`rounded-xl border py-2 text-[11px] font-medium transition-all duration-150 ${
                smoothing === s.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-[#B8A88B]/50 bg-[#FAF3E4] text-[#3a352c] hover:border-[#B8A88B]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Colour</p>
      <div className="flex flex-wrap items-center gap-2.5">
        {PALETTE.map((hex) => (
          <button
            key={hex}
            onClick={() => setColor(hex)}
            className={`h-8 w-8 rounded-full border transition-transform ${color === hex ? "scale-110 border-ink" : "border-line-soft"}`}
            style={{ background: hex }}
            aria-label={hex}
          />
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border border-line-soft bg-transparent p-0.5" aria-label="Custom colour" />
      </div>
      {recentColors.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">Recent</span>
          {recentColors.map((hex, i) => (
            <button key={`${hex}-${i}`} onClick={() => setColor(hex)} className="h-5 w-5 rounded-full border border-line-soft" style={{ background: hex }} aria-label={hex} />
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => design.undoStroke(side)}
          disabled={!design.canUndo(side)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft transition-colors hover:border-ink-soft disabled:opacity-30"
        >
          <IconUndo className="h-4 w-4" /> Undo
        </button>
        <button
          onClick={() => design.redoStroke(side)}
          disabled={!design.canRedo(side)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft transition-colors hover:border-ink-soft disabled:opacity-30"
        >
          <IconRedo className="h-4 w-4" /> Redo
        </button>
        <button
          onClick={() => {
            design.clearStrokes(side);
            track("drawing_started", { action: "clear", side });
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft transition-colors hover:border-ink-soft"
        >
          <IconTrash className="h-4 w-4" /> Clear
        </button>
      </div>

      {onRefine && (
        <button
          onClick={onRefine}
          disabled={strokes.length === 0 || isRefined}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8a96b] py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-[#241f1a] transition-opacity disabled:opacity-30"
        >
          {isRefined ? (
            <>
              <IconCheck className="h-4 w-4" /> Refined
            </>
          ) : (
            <>
              <IconSparkle className="h-4 w-4" /> Refine My Sketch
            </>
          )}
        </button>
      )}

      <p className="mt-5 font-display italic text-sm text-ink-faint">"Your canvas. Your rules."</p>
    </div>
  );
}
