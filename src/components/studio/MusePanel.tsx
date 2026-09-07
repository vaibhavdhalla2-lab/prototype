import { useState } from "react";
import { useDesign } from "../../lib/store";
import { interpretPrompt, type MuseConcept } from "../../lib/muse";
import { colorById, materialById, fitById, garmentById } from "../../data/catalog";
import { track } from "../../lib/analytics";
import { IconSparkle, IconCheck } from "../icons";

const EXAMPLES = [
  "Minimal oversized black T-shirt.",
  "Vintage football-inspired jersey aesthetic.",
  "Futuristic oversized hoodie with subtle graphics.",
  "I want something premium, clean and understated.",
];

export default function MusePanel() {
  const design = useDesign();
  const [text, setText] = useState("");
  const [concept, setConcept] = useState<MuseConcept | null>(null);
  const [thinking, setThinking] = useState(false);
  const [applied, setApplied] = useState(false);

  const create = (value?: string) => {
    const t = value ?? text;
    if (!t.trim()) return;
    setText(t);
    setThinking(true);
    setApplied(false);
    track("prompt_submitted", { text: t, context: "studio" });
    window.setTimeout(() => {
      setConcept(interpretPrompt(t));
      setThinking(false);
    }, 800);
  };

  const apply = () => {
    if (!concept) return;
    design.setGarment(concept.garment);
    design.setColor(concept.color);
    design.setMaterial(concept.material);
    design.setFit(concept.fit);
    track("muse_recommendation_used", { context: "studio_prompt" });
    setApplied(true);
  };

  if (concept) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <IconSparkle className="h-4 w-4 text-clay-deep" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-clay-deep">Muse concept</p>
        </div>
        <p className="mt-3 text-sm italic leading-relaxed text-ink-soft">"{text}"</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{concept.reason}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-line-soft bg-ivory-dim p-4 text-[13px]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Product</p>
            <p className="text-ink">{garmentById(concept.garment).label}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Colour</p>
            <p className="text-ink">{colorById(concept.color).label}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Material</p>
            <p className="text-ink">{materialById(concept.material).label}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Fit</p>
            <p className="text-ink">{fitById(concept.fit).label}</p>
          </div>
        </div>

        {!applied ? (
          <div className="mt-4 flex gap-2">
            <button onClick={apply} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[12px] uppercase tracking-[0.1em] text-ivory">
              <IconCheck className="h-3.5 w-3.5" /> Use This
            </button>
            <button onClick={() => setConcept(null)} className="flex-1 rounded-full border border-line py-2.5 text-[12px] uppercase tracking-[0.1em] text-ink-soft">
              Try Again
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-1.5 text-[13px] text-ink animate-fade-in">
            <IconCheck className="h-4 w-4 text-clay-deep" /> Applied to your garment.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">What are you imagining?</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the kind of clothing you want..."
        rows={4}
        className="mt-3 w-full resize-none rounded-2xl border border-line bg-ivory px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            className="rounded-full border border-line-soft px-3 py-1.5 text-[11.5px] text-ink-soft transition-colors hover:border-ink-soft"
          >
            {ex}
          </button>
        ))}
      </div>
      <button
        onClick={() => create()}
        disabled={!text.trim() || thinking}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ivory disabled:opacity-30"
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
  );
}
