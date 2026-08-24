import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MARKET_DESIGNS, type MarketDesign } from "../data/marketplace";
import { garmentById, colorById, materialById, fitById } from "../data/catalog";
import { useDesign } from "../lib/store";
import { track } from "../lib/analytics";
import { GarmentStage } from "../components/Garment";
import { IconRemix, IconEye, IconClose } from "../components/icons";
import MicroPrompt from "../components/MicroPrompt";

const SECTIONS: { id: MarketDesign["section"]; label: string; sub: string }[] = [
  { id: "trending", label: "Trending", sub: "What's getting attention right now" },
  { id: "new", label: "New", sub: "Fresh off the canvas" },
  { id: "most-remixed", label: "Most Remixed", sub: "Designs the community keeps building on" },
  { id: "community", label: "From The Community", sub: "A wider look at what people are making" },
];

function DesignCard({ d, onOpen, onRemix }: { d: MarketDesign; onOpen: () => void; onRemix: () => void }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(26,23,18,0.4)]">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex aspect-[4/5] items-center justify-center p-6" style={{ background: `${d.accent}14` }}>
          <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
        </div>
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="text-left">
            <p className="font-display text-lg leading-tight text-ink">{d.name}</p>
            <p className="text-xs text-ink-faint">by @{d.creator}</p>
          </button>
          <p className="whitespace-nowrap text-sm font-medium text-ink">₹{d.price.toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-ink-faint">
            <IconRemix className="h-3.5 w-3.5" /> {d.remixes}
          </span>
          <button
            onClick={onRemix}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors group-hover:border-ink group-hover:text-ink"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-3xl bg-paper shadow-2xl animate-scale-in sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink-soft hover:text-ink">
          <IconClose className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-center p-10" style={{ background: `${d.accent}14` }}>
          <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-72 w-72" />
        </div>
        <div className="p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">by @{d.creator}</p>
          <h2 className="mt-1 font-display text-3xl text-ink">{d.name}</h2>
          <p className="mt-1 text-lg text-ink-soft">₹{d.price.toLocaleString("en-IN")}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line-soft bg-ivory-dim p-4 text-[13px]">
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Product</p><p className="text-ink">{garmentById(d.garment).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Colour</p><p className="text-ink">{colorById(d.color).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Material</p><p className="text-ink">{materialById(d.material).label}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Fit</p><p className="text-ink">{fitById(d.fit).label}</p></div>
          </div>

          <div className="mt-5 flex items-center gap-5 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5"><IconEye className="h-4 w-4" /> {d.views.toLocaleString("en-IN")}</span>
            <span className="flex items-center gap-1.5"><IconRemix className="h-4 w-4" /> {d.remixes} remixes</span>
          </div>

          <button onClick={onRemix} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ivory">
            <IconRemix className="h-4 w-4" /> Remix This Design
          </button>
          <p className="mt-3 text-center text-[12px] text-ink-faint">Discover → Remix → Make it your own.</p>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const design = useDesign();
  const [active, setActive] = useState<MarketDesign | null>(null);

  const goRemix = (d: MarketDesign) => {
    design.loadFromMarketDesign(d);
    track("clicked_remix", { design: d.id });
    navigate("/create", { state: { mode: "remix" } });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <div className="max-w-xl">
        <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-ink-faint">Marketplace</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Discover what people are creating</h1>
        <p className="mt-4 text-ink-soft">
          Every piece here started the same way yours can — a blank canvas. Remix anything and make it your own.
        </p>
      </div>

      {SECTIONS.map((s, i) => {
        const items = MARKET_DESIGNS.filter((d) => d.section === s.id);
        if (items.length === 0) return null;
        return (
          <section key={s.id} className={i === 0 ? "mt-14" : "mt-16"}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{s.label}</h2>
                <p className="mt-1 text-sm text-ink-faint">{s.sub}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((d) => (
                <DesignCard key={d.id} d={d} onOpen={() => setActive(d)} onRemix={() => goRemix(d)} />
              ))}
            </div>

            {i === 0 && (
              <div className="mt-8">
                <MicroPrompt question="Would you buy from a marketplace like this?" eventName="marketplace_browse" />
              </div>
            )}
          </section>
        );
      })}

      {active && <QuickView d={active} onClose={() => setActive(null)} onRemix={() => goRemix(active)} />}
    </div>
  );
}
