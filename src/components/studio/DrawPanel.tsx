import { useDesign, type DrawTool } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconUndo, IconRedo, IconTrash } from "../icons";

const TOOLS: { id: DrawTool; label: string }[] = [
  { id: "marker", label: "Marker" },
  { id: "pencil", label: "Pencil" },
  { id: "brush", label: "Brush" },
  { id: "eraser", label: "Eraser" },
];

const PALETTE = ["#1a1712", "#f1ead9", "#9a6a43", "#2f3d2e", "#5a2331", "#232d3f", "#c99a6f", "#ffffff"];

interface DrawPanelProps {
  tool: DrawTool;
  setTool: (t: DrawTool) => void;
  color: string;
  setColor: (c: string) => void;
}

export default function DrawPanel({ tool, setTool, color, setColor }: DrawPanelProps) {
  const design = useDesign();
  const side = design.view === "back" ? "back" : "front";

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Draw</p>
      <p className="mt-1 text-sm text-ink-soft">Don't overthink it. Draw something only you would wear.</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => design.setView("front")}
          className={`flex-1 rounded-xl border py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
            side === "front" ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft"
          }`}
        >
          Front
        </button>
        <button
          onClick={() => design.setView("back")}
          className={`flex-1 rounded-xl border py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
            side === "back" ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft"
          }`}
        >
          Back
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`rounded-xl border py-2.5 text-[11.5px] uppercase tracking-[0.04em] transition-colors ${
              tool === t.id ? "border-ink bg-ivory-dim text-ink" : "border-line text-ink-soft hover:border-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Colour</p>
      <div className="flex flex-wrap gap-2.5">
        {PALETTE.map((hex) => (
          <button
            key={hex}
            onClick={() => setColor(hex)}
            className={`h-8 w-8 rounded-full border transition-transform ${color === hex ? "scale-110 border-ink" : "border-line-soft"}`}
            style={{ background: hex }}
            aria-label={hex}
          />
        ))}
      </div>

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

      <p className="mt-5 font-display italic text-sm text-ink-faint">"Your canvas. Your rules."</p>
    </div>
  );
}
