import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../data/catalog";
import { PRODUCTS } from "../../data/products";
import type { ProductId } from "../../data/products";
import ProductStage from "../products/ProductStage";
import PrototypeNotice from "../PrototypeNotice";
import { IconArrowRight } from "../icons";

type Mode = "self" | "gift" | "marketplace";

const MODES: { id: Mode; label: string }[] = [
  { id: "self", label: "Create For Myself" },
  { id: "gift", label: "Create A Gift" },
  { id: "marketplace", label: "Customize A Marketplace Design" },
];

export default function CanvasPicker({
  onSelectProduct,
  onStartGift,
}: {
  onSelectProduct: (id: ProductId) => void;
  onStartGift: () => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("self");

  const selectMode = (m: Mode) => {
    setMode(m);
    if (m === "gift") onStartGift();
    if (m === "marketplace") navigate("/marketplace");
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">Start Creating</p>
      <h1 className="text-center font-display text-4xl text-ink sm:text-5xl animate-fade-up [animation-delay:60ms]">
        Choose your canvas.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-ink-soft animate-fade-up [animation-delay:120ms]">
        Six products. Pick one and step straight into the studio — MUSE, upload, draw and text are all waiting inside.
      </p>

      <PrototypeNotice className="mx-auto mt-8 max-w-md" />

      {/* mode switcher */}
      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2 animate-fade-up [animation-delay:160ms]">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMode(m.id)}
            className={`rounded-full border px-4 py-2 text-[11.5px] font-medium uppercase tracking-[0.1em] transition-colors ${
              mode === m.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-[#241f1a]/40"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* product grid — click straight into the studio, no intermediate step */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onSelectProduct(p.id)}
            style={{ animationDelay: `${200 + i * 60}ms` }}
            className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-[#d4af70]/25 bg-paper p-5 text-center transition-all duration-300 animate-fade-up hover:-translate-y-1.5 hover:border-[#c8a96b]/70 hover:shadow-[0_28px_64px_-30px_rgba(36,31,26,0.35)]"
          >
            <div className="flex h-32 w-full items-center justify-center sm:h-36">
              <ProductStage product={p.id} colorHex={COLORS[1].hex} view="front" variants={{}} className="h-full w-full" />
            </div>
            <h3 className="mt-3 font-display text-lg text-ink">{p.label}</h3>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{p.blurb}</p>
            <p className="mt-2.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">From ₹{p.basePrice.toLocaleString("en-IN")}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#8f7345] opacity-0 transition-opacity group-hover:opacity-100">
              Start Creating <IconArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
