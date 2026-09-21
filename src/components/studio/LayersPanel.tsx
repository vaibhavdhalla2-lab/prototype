import { useDesign, type Layer } from "../../lib/store";
import { IconType, IconUpload, IconDraw, IconLayers, IconEye, IconEyeOff, IconLock, IconCopy, IconTrash, IconSparkle } from "../icons";
import ShapeRenderer from "./ShapeRenderer";

function LayerIcon({ layer }: { layer: Layer }) {
  if (layer.type === "text") return <IconType className="h-4 w-4" />;
  if (layer.type === "image") return <IconUpload className="h-4 w-4" />;
  if (layer.type === "drawing") return <IconDraw className="h-4 w-4" />;
  return (
    <svg viewBox="-30 -30 60 60" className="h-4 w-4">
      <ShapeRenderer shape={layer.shape} color="currentColor" />
    </svg>
  );
}

export default function LayersPanel({ onAskMuse }: { onAskMuse?: (prompt: string) => void }) {
  const design = useDesign();
  if (!design.garment) return null;
  const side = design.view === "back" ? "back" : "front";
  const ordered = design.layersFor(side); // bottom-to-top
  const display = [...ordered].reverse(); // top-to-bottom, matching how most design tools list layers
  const selectedLayer = display.find((l) => l.id === design.selectedLayerId);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Layers · {side === "back" ? "Back" : "Front"}</p>
        {onAskMuse && selectedLayer && (
          <button
            onClick={() => onAskMuse(`Suggest a way to improve the "${selectedLayer.name}" layer.`)}
            className="flex shrink-0 items-center gap-1 text-[10.5px] uppercase tracking-[0.08em] text-[#8f7345] hover:text-[#241f1a]"
          >
            <IconSparkle className="h-3 w-3" /> Ask MUSE
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">Everything on your product, top to bottom. Reorder, hide, lock or remove anything.</p>

      {display.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-soft py-10 text-center">
          <IconLayers className="h-5 w-5 text-ink-faint" />
          <p className="text-[13px] text-ink-faint">Nothing here yet — draw, upload or type something to see it appear as a layer.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {display.map((layer, i) => {
            const isTop = i === 0;
            const isBottom = i === display.length - 1;
            const selected = design.selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${selected ? "border-[#c8a96b] bg-[#c8a96b]/[0.06]" : "border-line"} ${!layer.visible ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => design.selectLayer(layer.id)}
                  className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                  disabled={layer.type === "drawing"}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ivory-dim text-ink-soft">
                    <LayerIcon layer={layer} />
                  </span>
                  <span className="truncate text-[13px] text-ink">{layer.name}</span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => design.reorderLayer(layer.id, "up")}
                    disabled={isTop}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-ivory-dim disabled:opacity-25"
                    aria-label="Bring forward"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => design.reorderLayer(layer.id, "down")}
                    disabled={isBottom}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-ivory-dim disabled:opacity-25"
                    aria-label="Send backward"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => design.setLayerVisible(layer.id, !layer.visible)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-ivory-dim"
                    aria-label={layer.visible ? "Hide" : "Show"}
                  >
                    {layer.visible ? <IconEye className="h-3.5 w-3.5" /> : <IconEyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => design.setLayerLocked(layer.id, !layer.locked)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ivory-dim ${layer.locked ? "text-[#8f7345]" : "text-ink-faint"}`}
                    aria-label={layer.locked ? "Unlock" : "Lock"}
                  >
                    <IconLock className="h-3.5 w-3.5" />
                  </button>
                  {layer.type !== "drawing" && (
                    <button onClick={() => design.duplicateLayer(layer.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-ivory-dim" aria-label="Duplicate">
                      <IconCopy className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => (layer.type === "drawing" ? design.clearStrokes(side) : design.removeLayer(layer.id))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-ivory-dim"
                    aria-label="Delete"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
