import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDesign } from "../../lib/store";
import { colorById, materialById, fitById, estimatePrice, DELIVERY_ESTIMATE } from "../../data/catalog";
import { isApparel, productById, variantGroupsFor, variantPriceImpact } from "../../data/products";
import ProductStage from "../products/ProductStage";
import { track } from "../../lib/analytics";
import { IconCheck, IconSparkle, IconArrowRight, IconChevronDown } from "../icons";
import MicroPrompt from "../MicroPrompt";

interface SummaryPanelProps {
  onJump: (category: string, sub?: string) => void;
  previewFrontOverlay?: ReactNode;
  previewBackOverlay?: ReactNode;
}

type Stage = "compact" | "final";

export default function SummaryPanel({ onJump, previewFrontOverlay, previewBackOverlay }: SummaryPanelProps) {
  const design = useDesign();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("compact");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [published, setPublished] = useState(false);

  if (!design.garment) return null;
  const productId = design.garment;
  const apparel = isApparel(productId);
  const product = productById(productId);
  const color = colorById(design.color);
  const hasImageOrGraphic = design.layers.some((l) => l.type === "image" || l.type === "graphic");
  const hasDrawing = design.layers.some((l) => l.type === "drawing" && l.strokes.length > 0);
  const hasText = design.layers.some((l) => l.type === "text" && l.content.trim());
  const hasGraphic = hasImageOrGraphic || hasDrawing;

  const price = apparel
    ? estimatePrice({ garment: productId, material: design.material, hasGraphic, hasText })
    : product.basePrice + variantPriceImpact(productId, design.variants) + (hasGraphic ? 250 : 0) + (hasText ? 100 : 0);

  const rows: { label: string; value: string; category: string | null; sub?: string }[] = [
    { label: "Product", value: product.label, category: null },
    { label: "Colour", value: color.label, category: "color" },
  ];
  if (apparel) {
    rows.push({ label: "Material", value: materialById(design.material).label, category: "material" });
    rows.push({ label: "Fit", value: fitById(design.fit).label, category: "fit" });
  } else {
    for (const group of variantGroupsFor(productId)) {
      const chosen = group.options.find((o) => o.id === design.variants[group.key]) ?? group.options[0];
      rows.push({ label: group.label, value: chosen.label, category: "fit" });
    }
  }
  const designValue = hasGraphic && hasText ? "Custom graphic + text" : hasGraphic ? "Custom graphic" : hasText ? "Text only" : "Plain";
  rows.push({ label: "Design", value: designValue, category: "design", sub: "draw" });
  if (apparel) rows.push({ label: "Details", value: design.accentTrim ? "Contrast trim" : "Tonal trim", category: "details" });

  const oneLine = apparel
    ? `${color.label} · ${materialById(design.material).label} · ${fitById(design.fit).label}`
    : rows
        .slice(1, -1)
        .map((r) => r.value)
        .join(" · ");

  const goToFinal = () => {
    setStage("final");
    track("make_it_real_clicked", { garment: design.garment, price });
    track("price_viewed", { garment: design.garment });
    track("delivery_viewed", { garment: design.garment });
  };

  if (stage === "compact") {
    return (
      <div className="animate-fade-in">
        {design.sourceMode === "remix" && (
          <div className="mb-4 rounded-2xl border border-clay/30 bg-clay/[0.06] px-4 py-3 text-[13px] text-clay-deep">
            You're remixing an existing creation. Make it yours.
          </div>
        )}

        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Your creation</p>
        <button onClick={() => setExpanded((v) => !v)} className="mt-2.5 flex w-full items-start justify-between gap-3 text-left">
          <div>
            <p className="font-display text-lg text-ink">{product.label}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">{oneLine}</p>
          </div>
          <span className="mt-1 flex items-center gap-1 shrink-0 text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
            {expanded ? "Hide" : "View details"}
            <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </span>
        </button>

        {expanded && (
          <div className="mt-3 animate-fade-up divide-y divide-line-soft rounded-2xl border border-line-soft">
            {rows.map((r) => (
              <button
                key={r.label}
                onClick={() => r.category && onJump(r.category, r.sub)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-ivory-dim disabled:cursor-default"
                disabled={!r.category}
              >
                <span className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">{r.label}</span>
                <span className="text-[13px] text-ink">{r.value}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={goToFinal}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#241f1a] transition-transform hover:-translate-y-0.5"
        >
          Make It Real
          <IconArrowRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            setSaved(true);
            track("design_completed", { garment: design.garment });
            window.setTimeout(() => setSaved(false), 2400);
          }}
          className="mt-2.5 w-full rounded-full border border-line py-2.5 text-[12px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {saved ? "Saved to My Creations" : "Save Design"}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setStage("compact")} className="mb-4 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft">
        ← Back to review
      </button>

      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Your creation</p>
      <div className="mt-3 aspect-[5/3] w-full overflow-hidden rounded-2xl border border-line-soft bg-paper p-4">
        <ProductStage
          product={productId}
          colorHex={color.hex}
          view="front"
          variants={design.variants}
          fit={apparel ? design.fit : undefined}
          accentTrim={design.accentTrim}
          pocketVisible={design.pocketVisible}
          frontOverlay={previewFrontOverlay}
          backOverlay={previewBackOverlay}
          className="h-full w-full"
        />
      </div>

      <div className="mt-5 rounded-2xl bg-[#241f1a] px-5 py-5 text-[#faf4ea]">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#faf4ea]/60">Estimated price</p>
          <p className="font-display text-3xl text-[#d4af70]">₹{price.toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-[#faf4ea]/15 pt-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#faf4ea]/60">Estimated delivery</p>
          <p className="text-sm">{DELIVERY_ESTIMATE}</p>
        </div>
        <p className="mt-3 text-[11px] text-[#faf4ea]/50">Prototype estimate based on the current design and manufacturing assumptions.</p>
      </div>

      {!ordered ? (
        <button
          onClick={() => {
            setOrdered(true);
            track("design_completed", { garment: design.garment, ordered: true });
          }}
          className="mt-4 w-full rounded-full bg-[#c8a96b] py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-[#241f1a] transition-transform hover:-translate-y-0.5"
        >
          Order — Make It Real
        </button>
      ) : (
        <div className="mt-4 animate-scale-in rounded-2xl border border-[#d4af70]/30 bg-ivory-dim p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#241f1a] text-[#d4af70]">
            <IconCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-xl text-ink">You made this.</p>
          <p className="mt-1 text-[13px] text-ink-soft">From an idea in your head to something you can actually wear.</p>
          <p className="mt-3 text-[12px] uppercase tracking-[0.08em] text-ink-faint">
            Added to My Creations as an order-ready design. This prototype doesn't process real payments yet.
          </p>
          <div className="mt-4">
            <MicroPrompt question="Would you actually wear this?" eventName="post_creation" />
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-line-soft pt-6">
        {!publishOpen ? (
          <button onClick={() => setPublishOpen(true)} className="flex w-full items-center justify-between text-left">
            <div>
              <p className="font-display text-lg text-ink">Publish Design</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">Let other people discover, remix and buy your creation.</p>
            </div>
            <span className="text-ink-faint">＋</span>
          </button>
        ) : published ? (
          <div className="animate-scale-in text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-clay text-ivory">
              <IconSparkle className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-xl text-ink">Published to the marketplace.</p>
            <p className="mt-1 text-[13px] text-ink-soft">Your creation is now discoverable — remixes and purchases will show up in My Creations.</p>
            <button onClick={() => navigate("/marketplace")} className="mt-4 rounded-full border border-line px-5 py-2 text-[12px] uppercase tracking-[0.1em] text-ink">
              View Marketplace
            </button>
          </div>
        ) : (
          <div className="animate-fade-up">
            <p className="font-display text-lg text-ink">Publish Design</p>
            <p className="mt-1 text-[13px] text-ink-soft">Let other people discover, remix and buy your creation.</p>

            <div className="mt-4 rounded-2xl border border-clay/30 bg-clay/[0.06] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-clay-deep">Creator reward</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                If your design is purchased by someone else, you'll receive a share of the profit generated from
                eligible sales — 10% to start, with room to grow as designs scale.
              </p>
              <p className="mt-1.5 text-[11px] italic text-ink-faint">Illustrative creator reward — subject to final FORMÉ terms.</p>
            </div>

            <label className="mt-4 flex items-start gap-2.5 text-[12.5px] text-ink-soft">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
              I understand that publishing makes my design visible to other users and that I must have the rights
              to any artwork or content I upload.
            </label>

            <div className="mt-4 flex gap-2">
              <button
                disabled={!agreed}
                onClick={() => {
                  setPublished(true);
                  track("publish_clicked", { garment: design.garment });
                }}
                className="flex-1 rounded-full bg-[#c8a96b] py-3 text-[12px] uppercase tracking-[0.12em] text-[#241f1a] disabled:opacity-30"
              >
                Publish To Marketplace
              </button>
              <button onClick={() => setPublishOpen(false)} className="flex-1 rounded-full border border-line py-3 text-[12px] uppercase tracking-[0.12em] text-ink-soft">
                Keep Private
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
