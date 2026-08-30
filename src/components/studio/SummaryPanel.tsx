import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDesign } from "../../lib/store";
import { colorById, materialById, fitById, garmentById, estimatePrice, DELIVERY_ESTIMATE } from "../../data/catalog";
import { GarmentStage } from "../Garment";
import { track } from "../../lib/analytics";
import { IconCheck, IconSparkle, IconArrowRight } from "../icons";
import MicroPrompt from "../MicroPrompt";

interface SummaryPanelProps {
  onJump: (category: string, sub?: string) => void;
  previewFrontOverlay?: ReactNode;
  previewBackOverlay?: ReactNode;
}

type Stage = "review" | "final";

export default function SummaryPanel({ onJump, previewFrontOverlay, previewBackOverlay }: SummaryPanelProps) {
  const design = useDesign();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("review");
  const [saved, setSaved] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [published, setPublished] = useState(false);

  if (!design.garment) return null;
  const garment = garmentById(design.garment);
  const color = colorById(design.color);
  const material = materialById(design.material);
  const fit = fitById(design.fit);
  const hasGraphic = !!design.artwork || design.strokesFront.length > 0 || design.strokesBack.length > 0;
  const price = estimatePrice({ garment: design.garment, material: design.material, hasGraphic, hasText: !!design.text });

  const rows: { label: string; value: string; category: string | null; sub?: string }[] = [
    { label: "Product", value: garment.label, category: null },
    { label: "Colour", value: color.label, category: "color" },
    { label: "Material", value: material.label, category: "material" },
    { label: "Fit", value: fit.label, category: "fit" },
    { label: "Design", value: hasGraphic ? "Custom graphic" : design.text ? "Text only" : "Plain", category: "design", sub: "draw" },
    { label: "Details", value: design.accentTrim ? "Contrast trim" : "Tonal trim", category: "details" },
  ];

  const goToFinal = () => {
    setStage("final");
    track("make_it_real_clicked", { garment: design.garment, price });
    track("price_viewed", { garment: design.garment });
    track("delivery_viewed", { garment: design.garment });
  };

  if (stage === "review") {
    return (
      <div className="animate-fade-in">
        {design.sourceMode === "remix" && (
          <div className="mb-5 rounded-2xl border border-clay/30 bg-clay/[0.06] px-4 py-3 text-[13px] text-clay-deep">
            You're remixing an existing creation. Make it yours.
          </div>
        )}

        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Your creation</p>
        <div className="mt-3 divide-y divide-line-soft rounded-2xl border border-line-soft">
          {rows.map((r) => (
            <button
              key={r.label}
              onClick={() => r.category && onJump(r.category, r.sub)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-ivory-dim disabled:cursor-default"
              disabled={!r.category}
            >
              <span className="text-[12.5px] uppercase tracking-[0.06em] text-ink-faint">{r.label}</span>
              <span className="text-sm text-ink">{r.value}</span>
            </button>
          ))}
        </div>

        <button
          onClick={goToFinal}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory transition-transform hover:-translate-y-0.5"
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
          className="mt-3 w-full rounded-full border border-line py-3 text-[12px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {saved ? "Saved to My Creations" : "Save Design"}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setStage("review")} className="mb-4 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft">
        ← Back to review
      </button>

      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Your creation</p>
      <div className="mt-3 aspect-[5/3] w-full overflow-hidden rounded-2xl border border-line-soft bg-paper p-4">
        <GarmentStage
          garment={design.garment}
          colorHex={color.hex}
          view="front"
          fit={design.fit}
          accentTrim={design.accentTrim}
          pocketVisible={design.pocketVisible}
          frontOverlay={previewFrontOverlay}
          backOverlay={previewBackOverlay}
          className="h-full w-full"
        />
      </div>

      <div className="mt-5 rounded-2xl bg-ink px-5 py-5 text-ivory">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ivory/60">Estimated price</p>
          <p className="font-display text-3xl">₹{price.toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-ivory/15 pt-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ivory/60">Estimated delivery</p>
          <p className="text-sm">{DELIVERY_ESTIMATE}</p>
        </div>
        <p className="mt-3 text-[11px] text-ivory/50">Prototype estimate based on the current design and manufacturing assumptions.</p>
      </div>

      {!ordered ? (
        <button
          onClick={() => {
            setOrdered(true);
            track("design_completed", { garment: design.garment, ordered: true });
          }}
          className="mt-4 w-full rounded-full bg-ink py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory transition-transform hover:-translate-y-0.5"
        >
          Order — Make It Real
        </button>
      ) : (
        <div className="mt-4 animate-scale-in rounded-2xl border border-line-soft bg-ivory-dim p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-ivory">
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
                className="flex-1 rounded-full bg-ink py-3 text-[12px] uppercase tracking-[0.12em] text-ivory disabled:opacity-30"
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
