import { useState } from "react";
import { useDesign } from "../../lib/store";
import { generateMuseVariants, type MuseVariant, type MuseStyleBias } from "../../lib/muse";
import { colorById } from "../../data/catalog";
import { isApparel, productById } from "../../data/products";
import ProductStage from "../products/ProductStage";
import { track } from "../../lib/analytics";
import { IconSparkle, IconCheck } from "../icons";

const STYLE_CHIPS = ["Minimal", "Vintage", "Playful", "Luxury", "Retro", "Abstract"];

/**
 * MUSE, promoted from a secondary drawer to a first-class creation mode: the
 * left editing panel itself becomes the MUSE interface — no overlay, nothing
 * covering the product. Describe an idea, get four concept thumbnails for
 * whatever product is currently active, refine with quick actions, apply.
 */
export default function MusePanel() {
  const design = useDesign();
  const [text, setText] = useState("");
  const [concepts, setConcepts] = useState<MuseVariant[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [applied, setApplied] = useState(false);
  const [nonce, setNonce] = useState(0);

  if (!design.garment) return null;
  const product = productById(design.garment);
  const apparel = isApparel(design.garment);

  const generate = (bias: MuseStyleBias = "neutral", regenerate = false) => {
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
    setApplied(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#241f1a] text-[#c8a96b]">
          <IconSparkle className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">MUSE · AI creation mode</p>
      </div>
      <p className="mt-2 font-display text-xl text-ink">What would you like to create?</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Describe the ${product.label.toLowerCase()} you're imagining...`}
        rows={3}
        className="mt-3 w-full resize-none rounded-2xl border border-line bg-ivory px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-[#c8a96b] focus:outline-none"
      />

      <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Suggested</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {STYLE_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setText((t) => (t ? `${t}, ${chip.toLowerCase()}` : `A ${chip.toLowerCase()} ${product.label.toLowerCase()}.`))}
            className="rounded-full border border-line-soft px-3 py-1.5 text-[11.5px] text-ink-soft transition-colors hover:border-[#c8a96b]/60 hover:text-ink"
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        onClick={() => generate("neutral")}
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
            <button onClick={() => generate("neutral", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
              More Like This
            </button>
            <button onClick={() => generate("minimal", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
              Make More Minimal
            </button>
            <button onClick={() => generate("bold", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
              Make More Bold
            </button>
            <button onClick={() => generate("neutral", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
              Change Colours
            </button>
            <button onClick={() => generate("neutral", true)} className="rounded-full border border-line-soft px-3 py-1.5 text-[11px] text-ink-soft hover:border-ink-soft">
              Another Variation
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
  );
}
