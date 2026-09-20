import { useState } from "react";
import { useDesign } from "../../lib/store";
import { COLORS, type ColorId } from "../../data/catalog";
import { productById, type ProductId } from "../../data/products";
import ProductStage from "../products/ProductStage";
import { track } from "../../lib/analytics";
import { IconSparkle, IconArrowRight, IconCheck } from "../icons";
import PrototypeNotice from "../PrototypeNotice";

const RELATIONSHIPS = ["Partner", "Friend", "Parent", "Sibling", "Colleague", "Someone new"];
const OCCASIONS = ["Birthday", "Anniversary", "Farewell", "Graduation", "Holiday", "Just because"];

interface Concept {
  product: ProductId;
  colorId: ColorId;
  colorHex: string;
  colorName: string;
  title: string;
  reason: string;
}

const PRODUCT_ROTATION: ProductId[] = ["tshirt", "mug", "poster", "bottle", "deskpad", "phonecase"];

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Deterministic "generation" — no live model, but the output visibly reacts to what was typed, which is what sells the concept in a prototype. */
function generateConcepts(input: { name: string; relationship: string; occasion: string; interests: string; personality: string }): Concept[] {
  const seedBase = hashString(`${input.name}|${input.relationship}|${input.occasion}|${input.interests}|${input.personality}`);
  const palette = COLORS;
  const titles: Record<ProductId, string> = {
    tshirt: "A tee that says it without saying it",
    hoodie: "An oversized statement piece",
    cap: "A finishing touch",
    mug: `${input.name || "Their"} morning ritual`,
    poster: `A print for ${input.name || "their"} wall`,
    bottle: "For every day, wherever they're headed",
    deskpad: `${input.name || "Their"} desk, upgraded`,
    phonecase: "Something they'll see 100 times a day",
  };

  return PRODUCT_ROTATION.map((product, i) => {
    const seed = seedBase + i * 97;
    const color = pick(palette, seed);
    const occasionLine = input.occasion ? `for ${input.occasion.toLowerCase()}` : "for no reason at all";
    const interestLine = input.interests ? `built around ${input.interests.split(",")[0]?.trim() || input.interests}` : "kept intentionally simple";
    return {
      product,
      colorId: color.id,
      colorHex: color.hex,
      colorName: color.label,
      title: titles[product],
      reason: `${occasionLine[0].toUpperCase()}${occasionLine.slice(1)}, ${interestLine}.`,
    };
  });
}

type Phase = "form" | "generating" | "concepts";

export default function GiftFlow({ onBack, onEnterStudio }: { onBack: () => void; onEnterStudio: (product: ProductId) => void }) {
  const design = useDesign();
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [occasion, setOccasion] = useState("");
  const [interests, setInterests] = useState("");
  const [personality, setPersonality] = useState("");
  const [message, setMessage] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selected, setSelected] = useState<Concept | null>(null);

  const canGenerate = name.trim().length > 0 && relationship.length > 0;

  const generate = () => {
    if (!canGenerate) return;
    setPhase("generating");
    track("prompt_submitted", { source: "gift", relationship, occasion });
    window.setTimeout(() => {
      setConcepts(generateConcepts({ name, relationship, occasion, interests, personality }));
      setPhase("concepts");
    }, 1100);
  };

  const chooseConcept = (c: Concept) => {
    setSelected(c);
    design.setGiftContext({ recipientName: name, relationship, occasion, interests, personality, message });
    design.setColor(c.colorId);
    track("muse_recommendation_used", { context: "gift", product: c.product });
  };

  if (phase === "form") {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
        <button onClick={onBack} className="mb-6 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint hover:text-ink-soft">
          ← Back
        </button>
        <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em]" style={{ color: "#d4af70" }}>Design a gift</p>
        <h1 className="text-center font-display text-4xl text-ink sm:text-5xl">Describe the person.</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-ink-soft">
          Tell us a little about them — MUSE will turn it into a handful of gift concepts across different products.
        </p>
        <PrototypeNotice className="mx-auto mt-6 max-w-md" />

        <div className="mt-10 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-ink">Who is this for?</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Their name"
                maxLength={40}
                className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-ink">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="">Choose one</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[13px] font-medium text-ink">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    occasion === o ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink">Interests / hobbies / things they love</label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. hiking, vinyl records, oat milk lattes"
              maxLength={120}
              className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink">Their personality / vibe</label>
            <input
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. quiet and thoughtful, loud and funny, minimalist"
              maxLength={120}
              className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink">A message or quote (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Something to include on the design, if you like"
              className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#351c45] py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#d4af70] transition-opacity disabled:opacity-30 hover:opacity-90"
          >
            <IconSparkle className="h-4 w-4" />
            Generate Gift Concepts
          </button>
        </div>
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <div className="flex items-center gap-2 text-[13px] text-ink-soft">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:300ms]" />
          </span>
          MUSE is thinking about {name || "them"}…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <button onClick={() => setPhase("form")} className="mb-6 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint hover:text-ink-soft">
        ← Edit details
      </button>
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em]" style={{ color: "#d4af70" }}>Gift concepts for {name}</p>
      <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">Pick one to make it real.</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-ink-soft">
        Every concept below is a real, editable starting point — choose one to open it in the studio and make it yours.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {concepts.map((c) => {
          const isSelected = selected?.product === c.product;
          return (
            <button
              key={c.product}
              onClick={() => chooseConcept(c)}
              className={`card-atelier group flex flex-col overflow-hidden text-left transition-all ${isSelected ? "ring-2 ring-[#351c45]" : ""}`}
            >
              <div className="flex aspect-square items-center justify-center p-6" style={{ background: `${c.colorHex}14` }}>
                <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                  <ProductStage product={c.product} colorHex={c.colorHex} view="front" variants={{}} className="h-full w-full" />
                </div>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {productById(c.product).label} · {c.colorName}
                </p>
                <p className="mt-1 font-display text-base leading-tight text-ink">{c.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{c.reason}</p>
                {isSelected && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-clay-deep">
                    <IconCheck className="h-3.5 w-3.5" /> Selected
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={() => onEnterStudio(selected.product)}
            className="flex items-center gap-2 rounded-full bg-[#351c45] px-8 py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#d4af70] transition-transform hover:-translate-y-0.5"
          >
            Customize This Gift
            <IconArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[12px] text-ink-faint">Opens in the studio, ready to refine.</p>
        </div>
      )}
    </div>
  );
}
