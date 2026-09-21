import { useEffect, useRef, useState } from "react";
import { useDesign, type ImageLayer, type GraphicLayer } from "../../lib/store";
import { generateMuseVariants, type MuseVariant, type MuseStyleBias, MUSE_STYLE_MODIFIERS, MUSE_EXAMPLE_PROMPTS } from "../../lib/muse";
import { interpretLocalEdit } from "../../lib/localEdit";
import type { RegionSelection } from "./Magnifier";
import { colorById } from "../../data/catalog";
import { isApparel, productById } from "../../data/products";
import ProductStage from "../products/ProductStage";
import { track } from "../../lib/analytics";
import { IconSparkle, IconCheck, IconUndo } from "../icons";

const REGION_CHIPS = [
  "Add a tiny hand-drawn gold star here",
  "Place my initials subtly in this corner",
  "Add fine floral linework",
  "Make these lines more intricate",
  "Add small serif text underneath",
  "Remove this element only from this area",
];

export interface MusePanelProps {
  inspecting: boolean;
  region: RegionSelection | null;
  prefill?: string | null;
  onPrefillConsumed?: () => void;
  className?: string;
}

/**
 * MUSE, FORMÉ's permanent creative agent — lives full-height on the right of
 * the studio (desktop) so it always has room to be a real conversation, not
 * a cramped drawer. It operates at two levels: with no magnifier region
 * selected, it reasons about the whole product (colour/material/variant
 * concepts, same as before); with a region selected, it switches to local
 * mode and only ever adds/adjusts one small layer confined to that area.
 */
export default function MusePanel({ inspecting, region, prefill, onPrefillConsumed, className }: MusePanelProps) {
  const design = useDesign();
  const [text, setText] = useState("");
  const [concepts, setConcepts] = useState<MuseVariant[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [applied, setApplied] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [scopeOverride, setScopeOverride] = useState<"auto" | "product">("auto");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill) {
      setText(prefill);
      textareaRef.current?.focus();
      onPrefillConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // switching between whole-product and selected-area editing starts with a clean prompt each time
  useEffect(() => {
    setText("");
  }, [inspecting]);

  if (!design.garment) {
    return (
      <div className={className}>
        <MuseHeader />
        <p className="mt-6 text-sm text-ink-soft">Choose a product to start a conversation with MUSE.</p>
      </div>
    );
  }

  const product = productById(design.garment);
  const apparel = isApparel(design.garment);
  const exampleList = MUSE_EXAMPLE_PROMPTS[design.garment] ?? [];
  const regionMode = inspecting && !!region && scopeOverride !== "product";
  const side = design.view === "back" ? "back" : "front";

  const layersInRegion = () => {
    if (!region) return [];
    const r = 0.24; // matches the lens footprint closely enough for a prototype-grade region match
    return design.layersFor(region.side).filter((l) => l.type !== "drawing" && Math.hypot(l.x - region.x, l.y - region.y) < r);
  };

  const generateProduct = (bias: MuseStyleBias = "neutral", regenerate = false) => {
    if (!regenerate && !text.trim()) return;
    setThinking(true);
    setApplied(false);
    track("prompt_submitted", { text, context: "studio", bias });
    const nextNonce = nonce + 1;
    setNonce(nextNonce);
    window.setTimeout(() => {
      setConcepts(generateMuseVariants(text || product.label, design.garment!, bias, nextNonce));
      setSelected(0);
      setThinking(false);
    }, 750);
  };

  const applyConcept = (c: MuseVariant) => {
    design.setColor(c.colorId);
    if (apparel) {
      if (c.material) design.setMaterial(c.material);
      if (c.fit) design.setFit(c.fit);
    } else if (c.variants) {
      for (const [key, value] of Object.entries(c.variants)) design.setVariant(key, value);
    }
    track("muse_recommendation_used", { context: "studio_prompt" });
    design.addMuseHistory({ prompt: text || "(quick action)", scope: "product", summary: `Applied ${colorById(c.colorId).label.toLowerCase()} concept to the whole product.` });
    setApplied(true);
  };

  const submitRegion = () => {
    if (!text.trim() || !region) return;
    setThinking(true);
    track("prompt_submitted", { text, context: "studio_region" });
    window.setTimeout(() => {
      const { action, summary } = interpretLocalEdit(text);
      let layerId: string | undefined;
      if (action.type === "addText") {
        layerId = design.addTextLayer(region.side, { content: action.content, x: region.x, y: region.y, scale: 0.55 });
        if (action.color) design.updateLayer(layerId, { color: action.color });
      } else if (action.type === "addGraphic") {
        layerId = design.addGraphicLayer(region.side, action.shape, action.color ?? "#1a1712", { x: region.x, y: region.y, scale: 0.4 });
      } else if (action.type === "removeInRegion") {
        for (const l of layersInRegion()) design.removeLayer(l.id);
      } else if (action.type === "tweakInRegion") {
        for (const l of layersInRegion()) {
          if (l.type === "image") design.updateLayer<ImageLayer>(l.id, { grayscale: action.grayscale ?? l.grayscale, brightness: action.brightness ?? l.brightness });
          else if (l.type === "graphic") design.updateLayer<GraphicLayer>(l.id, { color: "#4a4038" });
        }
      }
      design.addMuseHistory({ prompt: text, scope: "region", regionLabel: `${side === "back" ? "Back" : "Front"} · ${region.label}`, summary, layerId });
      setThinking(false);
      setText("");
    }, 650);
  };

  const undoHistory = (layerId?: string) => {
    if (!layerId) return;
    design.removeLayer(layerId);
  };

  return (
    <div className={className}>
      <MuseHeader />

      {regionMode ? (
        <div className="mt-5 animate-fade-in">
          <div className="rounded-2xl border border-[#c8a96b]/40 bg-[#c8a96b]/[0.08] px-4 py-3">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#8f7345]">Editing</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink">
              {product.label} · {side === "back" ? "Back" : "Front"} · Selected area
            </p>
          </div>

          <div className="mt-3">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Apply to</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              <button onClick={() => setScopeOverride("auto")} className="flex items-center gap-2 text-left text-[13px] text-ink">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#241f1a]">
                  <span className="h-2 w-2 rounded-full bg-[#241f1a]" />
                </span>
                Selected area
              </button>
              <button onClick={() => setScopeOverride("product")} className="flex items-center gap-2 text-left text-[13px] text-ink-faint hover:text-ink-soft">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line" />
                Whole product
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what to change here..."
            rows={3}
            className="mt-4 w-full resize-none rounded-2xl border border-line bg-ivory px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-[#c8a96b] focus:outline-none"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {REGION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setText(chip)}
                className="rounded-full border border-[#B8A88B]/50 bg-[#FAF3E4] px-3 py-1.5 text-[11px] font-medium text-[#3a352c] transition-all duration-150 hover:border-[#c8a96b]"
              >
                {chip}
              </button>
            ))}
          </div>

          <button
            onClick={submitRegion}
            disabled={!text.trim() || thinking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#241f1a] transition-transform hover:-translate-y-0.5 disabled:opacity-30"
          >
            {thinking ? (
              <>
                <IconSparkle className="h-4 w-4 animate-pulse" /> Working on it...
              </>
            ) : (
              <>
                <IconSparkle className="h-4 w-4" /> Apply To This Area
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-faint">Only the selected area changes — the rest of your design is untouched.</p>
        </div>
      ) : (
        <div className="mt-5 animate-fade-in">
          {inspecting && (
            <button onClick={() => setScopeOverride("auto")} className="mb-3 text-[11px] uppercase tracking-[0.1em] text-[#8f7345] hover:text-[#241f1a]">
              ← Back to editing selected area
            </button>
          )}
          <p className="font-display text-xl text-ink">What would you like to create?</p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Describe the ${product.label.toLowerCase()} you're imagining...`}
            rows={3}
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-ivory px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-[#c8a96b] focus:outline-none"
          />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Style</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {MUSE_STYLE_MODIFIERS.map((chip) => (
              <button
                key={chip}
                onClick={() => setText((t) => (t ? `${t}, ${chip.toLowerCase()}` : `A ${chip.toLowerCase()} ${product.label.toLowerCase()}.`))}
                className="rounded-full border border-[#B8A88B]/50 bg-[#FAF3E4] px-3 py-1.5 text-[11.5px] font-medium text-[#3a352c] transition-all duration-150 hover:border-[#c8a96b]"
              >
                {chip}
              </button>
            ))}
          </div>

          {exampleList.length > 0 && (
            <div className="mt-5">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Need inspiration?</p>
              <div className="mt-2 space-y-1.5">
                {exampleList.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setText(ex);
                      textareaRef.current?.focus();
                    }}
                    className="block w-full rounded-xl border border-line-soft bg-paper px-3.5 py-2.5 text-left text-[12.5px] italic leading-snug text-ink-soft transition-colors hover:border-[#c8a96b]/60 hover:text-ink"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => generateProduct("neutral")}
            disabled={!text.trim() || thinking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#241f1a] transition-transform hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0"
          >
            {thinking ? (
              <>
                <IconSparkle className="h-4 w-4 animate-pulse" /> MUSE is imagining...
              </>
            ) : (
              <>
                <IconSparkle className="h-4 w-4" /> Generate 4 Ideas
              </>
            )}
          </button>

          {concepts && !thinking && (
            <div className="mt-6 animate-fade-up">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Concepts for your {product.label.toLowerCase()}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {concepts.map((c, i) => {
                  const isActive = i === selected;
                  const color = colorById(c.colorId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected(i)}
                      className={`flex flex-col items-center rounded-2xl border p-2.5 transition-all ${
                        isActive ? "border-[#c8a96b] bg-[#c8a96b]/[0.08] shadow-[0_14px_30px_-18px_rgba(36,31,26,0.4)]" : "border-line hover:border-ink-soft"
                      }`}
                    >
                      <span className="flex h-16 w-full items-center justify-center">
                        <ProductStage
                          product={design.garment!}
                          colorHex={color.hex}
                          view="front"
                          variants={c.variants ?? design.variants}
                          fit={apparel ? c.fit : undefined}
                          className="h-full w-full"
                        />
                      </span>
                      <span className="mt-1.5 text-[11.5px] font-medium text-ink">{color.label}</span>
                      {isActive && <IconCheck className="mt-0.5 h-3 w-3 text-[#8f7345]" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">{concepts[selected].reason}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => generateProduct("neutral", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
                  More Like This
                </button>
                <button onClick={() => generateProduct("minimal", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
                  Make More Minimal
                </button>
                <button onClick={() => generateProduct("bold", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
                  Make More Bold
                </button>
              </div>

              {!applied ? (
                <button
                  onClick={() => applyConcept(concepts[selected])}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#241f1a] py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#d4af70]"
                >
                  <IconCheck className="h-3.5 w-3.5" /> Apply This Concept
                </button>
              ) : (
                <div className="mt-4 flex items-center gap-1.5 text-[13px] text-ink animate-fade-in">
                  <IconCheck className="h-4 w-4 text-[#8f7345]" /> Applied to your design.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {design.museHistory.length > 0 && (
        <div className="mt-8 border-t border-line-soft pt-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">History</p>
          <div className="mt-3 space-y-3">
            {design.museHistory.map((h) => (
              <div key={h.id} className="rounded-2xl border border-line-soft bg-ivory-dim/60 p-3.5">
                <p className="text-[13px] italic leading-snug text-ink-soft">"{h.prompt}"</p>
                {h.regionLabel && <p className="mt-1 text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">Applied to: {h.regionLabel}</p>}
                <p className="mt-1 text-[12.5px] text-ink">{h.summary}</p>
                {h.layerId && (
                  <button onClick={() => undoHistory(h.layerId)} className="mt-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-ink-faint hover:text-ink-soft">
                    <IconUndo className="h-3 w-3" /> Undo
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MuseHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#241f1a] text-[#c8a96b]">
        <IconSparkle className="h-4 w-4" />
      </span>
      <div>
        <p className="font-display text-lg leading-tight text-ink">MUSE</p>
        <p className="text-[11px] text-ink-faint">Your AI creative partner</p>
      </div>
    </div>
  );
}
