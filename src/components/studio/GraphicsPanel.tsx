import { useState } from "react";
import { useDesign, type GraphicLayer } from "../../lib/store";
import { SHAPES } from "../../lib/shapes";
import ShapeRenderer from "./ShapeRenderer";
import { threadTone } from "../../lib/color";
import { colorById } from "../../data/catalog";
import { track } from "../../lib/analytics";
import { IconCopy, IconTrash } from "../icons";

const ACCENTS = ["#1a1712", "#f1ead9", "#9a6a43", "#c8a96b", "#5a2331", "#232d3f", "#2f3d2e"];

export default function GraphicsPanel() {
  const design = useDesign();
  const garmentHex = colorById(design.color).hex;
  const [color, setColor] = useState(threadTone(garmentHex));

  if (!design.garment) return null;
  const side = design.view === "back" ? "back" : "front";
  const layers = design.layersFor(side).filter((l): l is GraphicLayer => l.type === "graphic");
  const selected = layers.find((l) => l.id === design.selectedLayerId) ?? null;

  const place = (id: (typeof SHAPES)[number]["id"]) => {
    design.addGraphicLayer(side, id, color);
    track("drawing_started", { side, tool: "graphic", motif: id });
  };

  if (selected) {
    const update = (patch: Partial<GraphicLayer>) => design.updateLayer<GraphicLayer>(selected.id, patch);
    return (
      <div className="animate-fade-in space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Editing shape</p>
          <button onClick={() => design.selectLayer(null)} className="text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
            Done
          </button>
        </div>
        <div className="flex h-20 items-center justify-center rounded-2xl border border-line bg-ivory-dim">
          <svg viewBox="-30 -30 60 60" className="h-14 w-14">
            <ShapeRenderer shape={selected.shape} color={selected.color} flipX={selected.flipX} flipY={selected.flipY} />
          </svg>
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Colour</p>
          <div className="flex flex-wrap gap-2">
            {[threadTone(garmentHex), ...ACCENTS].map((hex, i) => (
              <button
                key={i}
                onClick={() => update({ color: hex })}
                className={`h-7 w-7 rounded-full border transition-transform ${selected.color === hex ? "scale-110 border-ink" : "border-line-soft"}`}
                style={{ background: hex }}
                aria-label={hex}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => update({ flipX: !selected.flipX })}
            className={`flex-1 rounded-xl border py-2.5 text-[12px] uppercase tracking-[0.08em] transition-colors ${
              selected.flipX ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
            }`}
          >
            Flip H
          </button>
          <button
            onClick={() => update({ flipY: !selected.flipY })}
            className={`flex-1 rounded-xl border py-2.5 text-[12px] uppercase tracking-[0.08em] transition-colors ${
              selected.flipY ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft"
            }`}
          >
            Flip V
          </button>
        </div>
        <p className="text-[12px] text-ink-soft">Drag on the product to move · corner handle to resize · top handle to rotate.</p>

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

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Graphics</p>
      <p className="mt-1 text-sm text-ink-soft">Drop a ready-made shape onto the {side}. Pick a colour, then a shape — each one becomes its own movable layer.</p>

      <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Colour</p>
      <div className="flex flex-wrap gap-2">
        {[threadTone(garmentHex), ...ACCENTS].map((hex, i) => (
          <button
            key={i}
            onClick={() => setColor(hex)}
            className={`h-7 w-7 rounded-full border transition-transform ${color === hex ? "scale-110 border-ink" : "border-line-soft"}`}
            style={{ background: hex }}
            aria-label={hex}
          />
        ))}
      </div>

      <p className="mb-3 mt-5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Shape</p>
      <div className="grid grid-cols-4 gap-2.5">
        {SHAPES.map((m) => (
          <button
            key={m.id}
            onClick={() => place(m.id)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-line py-3 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <svg viewBox="-30 -30 60 60" className="h-6 w-6">
              <ShapeRenderer shape={m.id} color="currentColor" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.05em]">{m.label}</span>
          </button>
        ))}
      </div>

      {layers.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Placed shapes</p>
          <div className="flex flex-wrap gap-2">
            {layers.map((l) => (
              <button key={l.id} onClick={() => design.selectLayer(l.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-line hover:border-ink-soft">
                <svg viewBox="-30 -30 60 60" className="h-5 w-5">
                  <ShapeRenderer shape={l.shape} color={l.color} flipX={l.flipX} flipY={l.flipY} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-5 text-[12px] text-ink-faint">Placed shapes land in the centre of your print area — fine-tune position from there.</p>
    </div>
  );
}
