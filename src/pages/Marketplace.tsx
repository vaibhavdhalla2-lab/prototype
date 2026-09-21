import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MARKET_DESIGNS, type MarketDesign } from "../data/marketplace";
import { garmentById, colorById, materialById, fitById, type ColorId } from "../data/catalog";
import { designsFor, type DesignAsset } from "../data/designs.generated";
import { garmentColors } from "../lib/garmentColors";
import { useDesign } from "../lib/store";
import { track } from "../lib/analytics";
import { GarmentStage } from "../components/Garment";
import TShirtMockup from "../components/garment/TShirtMockup";
import GarmentColorSwatches from "../components/garment/GarmentColorSwatches";
import GradientMesh from "../components/GradientMesh";
import GlowButton from "../components/GlowButton";
import { IconRemix, IconEye, IconClose, IconSparkle } from "../components/icons";
import MicroPrompt from "../components/MicroPrompt";

// Cards default to a dark showcase colour — these prints read best on it —
// the quick-view lets you flip through the full garmentColors palette.
const AI_PRINT_SHOWCASE_COLOR = garmentColors.find((c) => c.name === "Black")?.value ?? garmentColors[0].value;

// Maps the photographic mockup's own colour palette back onto the catalog's
// ColorId so "Customize This" can hand the pick straight to the Studio.
const CATALOG_COLOR_FOR_GARMENT_COLOR: Record<string, ColorId> = {
  Cream: "stone",
  White: "offwhite",
  Black: "black",
  "Washed Grey": "grey",
  Navy: "navy",
  Olive: "forest",
  Burgundy: "burgundy",
};

/** A photorealistic showcase card for a MUSE-generated print — reuses the same canvas-composited TShirtMockup as the Studio, so the fabric folds and lighting are genuine, not a flat sticker. */
function AiPrintCard({ d, onOpen }: { d: DesignAsset; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card-atelier group block overflow-hidden text-left">
      <div className="flex aspect-[4/5] items-center justify-center bg-ink/[0.04] p-6">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <TShirtMockup color={AI_PRINT_SHOWCASE_COLOR} design={d.image} alt={d.name} />
        </div>
      </div>
      <div className="p-4">
        <p className="font-display text-lg leading-tight text-ink">{d.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
          <IconSparkle className="h-3 w-3" /> By MUSE Studio · {d.category}
        </p>
      </div>
    </button>
  );
}

function AiPrintQuickView({ designs, initial, onClose, onCustomize }: { designs: DesignAsset[]; initial: DesignAsset; onClose: () => void; onCustomize: (d: DesignAsset, colorName: string) => void }) {
  const [activeId, setActiveId] = useState(initial.id);
  const [color, setColor] = useState(AI_PRINT_SHOWCASE_COLOR);
  const active = designs.find((d) => d.id === activeId) ?? initial;
  const colorName = garmentColors.find((c) => c.value.toLowerCase() === color.toLowerCase())?.name ?? "Black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17151a]/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-3xl border border-[#d4af70]/30 bg-paper shadow-2xl animate-scale-in sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink-soft hover:text-ink">
          <IconClose className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center bg-ink/[0.04] p-10">
          <TShirtMockup color={color} design={active.image} alt={active.name} className="h-72 w-72" />
        </div>
        <div className="p-8">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-ink-faint">
            <IconSparkle className="h-3.5 w-3.5" /> By MUSE Studio
          </p>
          <h2 className="mt-1 font-display text-3xl text-ink">{active.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">{active.category}</p>

          <p className="mt-6 text-[11px] uppercase tracking-[0.15em] text-ink-faint">Colour</p>
          <div className="mt-2.5">
            <GarmentColorSwatches value={color} onChange={setColor} className="justify-start" />
          </div>

          {designs.length > 1 && (
            <>
              <p className="mt-6 text-[11px] uppercase tracking-[0.15em] text-ink-faint">Design</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`rounded-full border px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
                      d.id === active.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-[#241f1a]/40"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <GlowButton onClick={() => onCustomize(active, colorName)} className="mt-7 w-full justify-center">
            <IconRemix className="h-4 w-4" /> Customize This
          </GlowButton>
          <p className="mt-3 text-center text-[12px] text-ink-faint">Opens in the Studio with this print already on canvas.</p>
        </div>
      </div>
    </div>
  );
}

type Tab = "foryou" | "trending" | "new" | "most-remixed";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "foryou", label: "For You", sub: "A broad mix of what's out there right now" },
  { id: "trending", label: "Trending", sub: "What's getting attention right now" },
  { id: "new", label: "New", sub: "Fresh off the canvas" },
  { id: "most-remixed", label: "Most Remixed", sub: "Designs the community keeps building on" },
];

// Only T-shirts are live right now — hoodies/caps stay "Coming Soon" (see
// CanvasPicker), so the marketplace only ever shows what people can actually
// make and buy today.
const TSHIRT_DESIGNS = MARKET_DESIGNS.filter((d) => d.garment === "tshirt");

/** A collectible-object product card — glass surface, thin gold edge, soft plum shadow, gentle lift on hover. */
function DesignCard({ d, onOpen, onRemix }: { d: MarketDesign; onOpen: () => void; onRemix: () => void }) {
  return (
    <div className="card-atelier group overflow-hidden">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex aspect-[4/5] items-center justify-center p-6" style={{ background: `${d.accent}14` }}>
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
          </div>
        </div>
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="text-left">
            <p className="font-display text-lg leading-tight text-ink">{d.name}</p>
            <p className="text-xs text-ink-faint">by @{d.creator}</p>
          </button>
          <p className="whitespace-nowrap text-sm font-medium text-[#241f1a]">₹{d.price.toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-ink-faint">
            <IconRemix className="h-3.5 w-3.5" /> {d.remixes}
          </span>
          <button
            onClick={onRemix}
            className="flex items-center gap-1.5 rounded-full border border-[#241f1a]/25 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors group-hover:border-[#241f1a] group-hover:text-[#241f1a]"
          >
            <IconRemix className="h-3 w-3" /> Remix
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickView({ d, onClose, onRemix }: { d: MarketDesign; onClose: () => void; onRemix: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17151a]/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-3xl border border-[#d4af70]/30 bg-paper shadow-2xl animate-scale-in sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink-soft hover:text-ink">
          <IconClose className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center p-10" style={{ background: `${d.accent}14` }}>
          <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-72 w-72" />
        </div>
        <div className="p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">by @{d.creator}</p>
          <h2 className="mt-1 font-display text-3xl text-ink">{d.name}</h2>
          <p className="mt-1 text-lg font-medium text-[#241f1a]">₹{d.price.toLocaleString("en-IN")}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{d.story}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-[#241f1a]/15 bg-ivory-dim p-4 text-[13px]">
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Product</p><p className="text-ink">{garmentById(d.garment).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Colour</p><p className="text-ink">{colorById(d.color).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Material</p><p className="text-ink">{materialById(d.material).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Fit</p><p className="text-ink">{fitById(d.fit).label}</p></div>
          </div>

          <div className="mt-5 flex items-center gap-5 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5"><IconEye className="h-4 w-4" /> {d.views.toLocaleString("en-IN")}</span>
            <span className="flex items-center gap-1.5"><IconRemix className="h-4 w-4" /> {d.remixes} remixes</span>
          </div>

          <GlowButton onClick={onRemix} className="mt-7 w-full justify-center">
            <IconRemix className="h-4 w-4" /> Remix This Design
          </GlowButton>
          <p className="mt-3 text-center text-[12px] text-ink-faint">Discover → Remix → Make it your own.</p>
        </div>
      </div>
    </div>
  );
}

// A fixed shuffle (by id) so "For You" doesn't feel like a literal re-sort of the catalog.
const FOR_YOU_ORDER = [3, 11, 0, 15, 7, 18, 4, 9, 2, 16, 20, 12, 6, 19, 1, 14, 8, 17, 5, 13, 10];
const FOR_YOU_TSHIRTS = FOR_YOU_ORDER.map((i) => MARKET_DESIGNS[i]).filter((d): d is MarketDesign => d?.garment === "tshirt");

export default function Marketplace() {
  const navigate = useNavigate();
  const design = useDesign();
  const [active, setActive] = useState<MarketDesign | null>(null);
  const [tab, setTab] = useState<Tab>("foryou");
  const [activeAiPrint, setActiveAiPrint] = useState<DesignAsset | null>(null);
  const aiPrints = designsFor("tshirt");

  const goRemix = (d: MarketDesign) => {
    design.loadFromMarketDesign(d);
    track("remix_clicked", { design: d.id });
    navigate("/create", { state: { mode: "remix" } });
  };

  const goCustomizePrint = (d: DesignAsset, colorName: string) => {
    design.setGarment("tshirt");
    design.setColor(CATALOG_COLOR_FOR_GARMENT_COLOR[colorName] ?? "offwhite");
    design.setArtwork(d.image);
    design.setSourceMode("remix");
    design.setName(`${d.name} (Custom)`);
    track("remix_clicked", { design: d.id, source: "ai-print" });
    navigate("/create", { state: { mode: "remix" } });
  };

  const items = tab === "foryou" ? FOR_YOU_TSHIRTS : TSHIRT_DESIGNS.filter((d) => d.section === tab);
  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="grain relative">
      <GradientMesh fixed />
      <div className="relative mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <div className="max-w-xl">
          <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: "#d4af70" }}>Marketplace</p>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">Discover what people are creating</h1>
          <p className="mt-4 text-ink-soft">
            Every piece here started the same way yours can — a blank canvas. Remix anything and make it your own.
          </p>
        </div>

        {aiPrints.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-center gap-2">
              <IconSparkle className="h-4 w-4" style={{ color: "#d4af70" }} />
              <div>
                <h2 className="font-display text-2xl text-ink sm:text-3xl">New From MUSE</h2>
                <p className="mt-0.5 text-sm text-ink-faint">Original prints generated by MUSE, rendered true to fabric — pick one to see it come to life.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {aiPrints.map((d) => (
                <AiPrintCard key={d.id} d={d} onOpen={() => setActiveAiPrint(d)} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
                tab === t.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-[#241f1a]/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="mt-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{activeTab.label}</h2>
            <p className="mt-1 text-sm text-ink-faint">{activeTab.sub}</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-soft py-16 text-center text-ink-faint">
              Nothing here yet — try a different category.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((d) => (
                <DesignCard key={d.id} d={d} onOpen={() => setActive(d)} onRemix={() => goRemix(d)} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <MicroPrompt question="Would you buy from a marketplace like this?" eventName="marketplace_browse" />
          </div>
        </section>

        {active && <QuickView d={active} onClose={() => setActive(null)} onRemix={() => goRemix(active)} />}
        {activeAiPrint && (
          <AiPrintQuickView
            designs={aiPrints}
            initial={activeAiPrint}
            onClose={() => setActiveAiPrint(null)}
            onCustomize={goCustomizePrint}
          />
        )}
      </div>
    </div>
  );
}
