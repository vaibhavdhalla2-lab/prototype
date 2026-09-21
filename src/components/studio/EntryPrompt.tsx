import { useState } from "react";
import { useDesign } from "../../lib/store";
import { interpretPrompt, type MuseConcept } from "../../lib/muse";
import { colorById, materialById, fitById } from "../../data/catalog";
import { isApparel, productById } from "../../data/products";
import { track } from "../../lib/analytics";
import PrototypeNotice from "../PrototypeNotice";
import { IconSparkle, IconCheck } from "../icons";

const EXAMPLE = "I want an oversized black hoodie with a minimal futuristic design inspired by Tokyo nightlife.";

export default function EntryPrompt({ onEnterStudio, initialText }: { onEnterStudio: (tab: string) => void; initialText?: string }) {
  const design = useDesign();
  const [text, setText] = useState(initialText ?? "");
  const [concept, setConcept] = useState<MuseConcept | null>(null);
  const [thinking, setThinking] = useState(false);

  const create = () => {
    if (!text.trim()) return;
    setThinking(true);
    track("prompt_submitted", { text });
    window.setTimeout(() => {
      setConcept(interpretPrompt(text));
      setThinking(false);
    }, 900);
  };

  const apply = (jumpTo: string) => {
    if (!concept) return;
    design.setGarment(concept.product);
    design.setColor(concept.color);
    if (isApparel(concept.product)) {
      if (concept.material) design.setMaterial(concept.material);
      if (concept.fit) design.setFit(concept.fit);
    } else if (concept.variants) {
      for (const [key, value] of Object.entries(concept.variants)) design.setVariant(key, value);
    }
    design.setSourceMode("prompt");
    onEnterStudio(jumpTo);
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">Describe it</p>
      <h1 className="text-center font-display text-4xl text-ink animate-fade-up [animation-delay:60ms]">
        Describe what you're imagining
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-ink-soft animate-fade-up [animation-delay:120ms]">
        Tell MUSE what you're picturing — a mood, a colour, a feeling. We'll create the whole product for you, ready to refine.
      </p>

      <PrototypeNotice className="mt-7" />

      {!concept && (
        <div className="mt-9 animate-fade-up [animation-delay:180ms]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`e.g. ${EXAMPLE}`}
            rows={5}
            className="w-full resize-none rounded-2xl border border-line bg-paper px-5 py-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
          <button
            onClick={create}
            disabled={!text.trim() || thinking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#241f1a] disabled:opacity-30"
          >
            {thinking ? (
              <>
                <IconSparkle className="h-4 w-4 animate-pulse" /> MUSE is imagining...
              </>
            ) : (
              <>
                <IconSparkle className="h-4 w-4" /> Create With MUSE
              </>
            )}
          </button>
        </div>
      )}

      {concept && (
        <div className="mt-9 animate-scale-in rounded-3xl border border-clay/30 bg-clay/[0.06] p-7">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-clay-deep">
            <IconSparkle className="h-3.5 w-3.5" /> Your concept
          </p>
          <p className="mt-3 text-sm italic leading-relaxed text-ink-soft">"{text}"</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{concept.reason}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-paper p-4 text-[13px] sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Product</p>
              <p className="text-ink">{productById(concept.product).label}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Colour</p>
              <p className="text-ink">{colorById(concept.color).label}</p>
            </div>
            {isApparel(concept.product) && concept.material && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Material</p>
                <p className="text-ink">{materialById(concept.material).label}</p>
              </div>
            )}
            {isApparel(concept.product) && concept.fit && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Fit</p>
                <p className="text-ink">{fitById(concept.fit).label}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Graphic</p>
              <p className="text-ink">{concept.graphicNote}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button onClick={() => apply("design")} className="flex items-center gap-2 rounded-full bg-[#c8a96b] px-5 py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#241f1a]">
              <IconCheck className="h-3.5 w-3.5" /> Use This
            </button>
            <button onClick={() => apply("color")} className="rounded-full border border-line px-5 py-2.5 text-[12px] uppercase tracking-[0.1em] text-ink-soft">
              Tweak It
            </button>
            <button
              onClick={() => {
                setConcept(null);
                setText("");
              }}
              className="rounded-full border border-line px-5 py-2.5 text-[12px] uppercase tracking-[0.1em] text-ink-soft"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
