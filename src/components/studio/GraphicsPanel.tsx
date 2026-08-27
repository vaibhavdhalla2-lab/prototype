import { useState } from "react";
import { useDesign, type DrawStroke } from "../../lib/store";
import { MOTIFS, motifPathD, motifIconD } from "../../lib/motifs";
import { PRINT_AREAS } from "../Garment";
import { track } from "../../lib/analytics";
import { threadTone } from "../../lib/color";
import { colorById } from "../../data/catalog";

const ACCENTS = ["#1a1712", "#f1ead9", "#9a6a43", "#5a2331", "#232d3f", "#2f3d2e"];

export default function GraphicsPanel() {
  const design = useDesign();
  const garmentHex = colorById(design.color).hex;
  const [color, setColor] = useState(threadTone(garmentHex));

  if (!design.garment) return null;
  const side = design.view === "back" ? "back" : "front";
  const area = PRINT_AREAS[design.garment][side];
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;

  const place = (id: (typeof MOTIFS)[number]["id"]) => {
    const stroke: DrawStroke = {
      id: `motif-${id}-${Date.now()}`,
      d: motifPathD(id, cx, cy, 2.4),
      color,
      width: 4.5,
      opacity: 0.95,
    };
    design.addStroke(side, stroke);
    track("drawing_started", { side, tool: "graphic", motif: id });
  };

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Graphics</p>
      <p className="mt-1 text-sm text-ink-soft">Drop a ready-made mark onto the {side}. Pick a colour, then a shape.</p>

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
      <div className="grid grid-cols-5 gap-2.5">
        {MOTIFS.map((m) => (
          <button
            key={m.id}
            onClick={() => place(m.id)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-line py-3 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <svg viewBox="0 0 40 40" className="h-6 w-6">
              <path d={motifIconD(m.id)} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.05em]">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-5 text-[12px] text-ink-faint">Placed shapes land in the centre of your print area — fine-tune further from Draw.</p>
    </div>
  );
}
