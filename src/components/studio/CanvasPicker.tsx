import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../data/catalog";
import { PRODUCTS } from "../../data/products";
import type { ProductId } from "../../data/products";
import ProductStage from "../products/ProductStage";
import PrototypeNotice from "../PrototypeNotice";
import { IconArrowRight, IconUpload, IconSparkle, IconDraw, IconType, IconStore } from "../icons";

type Mode = "self" | "gift" | "marketplace";
type Method = "muse" | "image" | "draw" | "text";

const MODES: { id: Mode; label: string }[] = [
  { id: "self", label: "Create For Myself" },
  { id: "gift", label: "Create A Gift" },
  { id: "marketplace", label: "Customize A Marketplace Design" },
];

const METHODS: { id: Method; label: string; body: string; icon: typeof IconUpload }[] = [
  { id: "muse", label: "Write A Prompt", body: "Describe it — MUSE turns words into a starting point.", icon: IconSparkle },
  { id: "text", label: "Manual Design", body: "Blank canvas — arrange text, shapes and graphics yourself.", icon: IconType },
  { id: "image", label: "Upload A Graphic", body: "Show us your artwork, logo or photo.", icon: IconUpload },
  { id: "draw", label: "Freehand Draw", body: "Sketch it rough. We'll help make it real.", icon: IconDraw },
];

export default function CanvasPicker({
  onSelectProduct,
  onSelectMethod,
  onStartGift,
}: {
  onSelectProduct: (id: ProductId) => void;
  onSelectMethod: (method: Method, product: ProductId) => void;
  onStartGift: () => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("self");
  const [activeProduct, setActiveProduct] = useState<ProductId>("tshirt");

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
        Six products, five ways to start. Pick a product below, then how you want to design it.
      </p>

      <PrototypeNotice className="mx-auto mt-8 max-w-md" />

      {/* mode switcher */}
      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2 animate-fade-up [animation-delay:160ms]">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMode(m.id)}
            className={`rounded-full border px-4 py-2 text-[11.5px] font-medium uppercase tracking-[0.1em] transition-colors ${
              mode === m.id ? "border-[#351c45] bg-[#351c45] text-[#d4af70]" : "border-line text-ink-soft hover:border-[#351c45]/40"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* product grid — click to highlight, "Start Creating" below commits */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PRODUCTS.map((p, i) => {
          const isActive = p.id === activeProduct;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProduct(p.id)}
              style={{ animationDelay: `${200 + i * 60}ms` }}
              className={`group relative flex flex-col items-center overflow-hidden rounded-3xl border p-5 text-center transition-all duration-300 animate-fade-up ${
                isActive
                  ? "border-[#351c45] bg-paper shadow-[0_24px_60px_-24px_rgba(53,28,69,0.35)]"
                  : "border-[#d4af70]/25 bg-paper hover:-translate-y-1 hover:border-[#d4af70]/60"
              }`}
            >
              <div className="flex h-32 w-full items-center justify-center sm:h-36">
                <ProductStage product={p.id} colorHex={COLORS[1].hex} view="front" variants={{}} className="h-full w-full" />
              </div>
              <h3 className="mt-3 font-display text-lg text-ink">{p.label}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{p.blurb}</p>
              <p className="mt-2.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">From ₹{p.basePrice.toLocaleString("en-IN")}</p>
              {isActive && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#351c45] px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[#d4af70]">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => onSelectProduct(activeProduct)}
          className="flex items-center gap-2 rounded-full bg-[#351c45] px-7 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-[#d4af70] transition-transform hover:-translate-y-0.5"
        >
          Start Creating A {PRODUCTS.find((p) => p.id === activeProduct)!.label}
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* creation methods for the highlighted product */}
      <div className="mt-14">
        <p className="text-center text-[12px] uppercase tracking-[0.25em] text-ink-faint">
          Or choose how you want to design your {PRODUCTS.find((p) => p.id === activeProduct)!.label.toLowerCase()}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMethod(m.id, activeProduct)}
              className="group flex items-start gap-3 rounded-2xl border border-line bg-paper p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[0_16px_36px_-24px_rgba(26,23,18,0.35)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-soft text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
                <m.icon className="h-4.5 w-4.5" />
              </span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-medium text-ink">{m.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-soft">{m.body}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onStartGift}
          className="group mt-3 flex w-full items-center gap-3 rounded-2xl border border-clay/35 bg-clay/[0.06] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-clay/60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-clay/40 text-clay-deep">
            <IconStore className="h-4.5 w-4.5" />
          </span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-medium text-clay-deep">Describe A Person — Gift Mode</span>
            <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-soft">Tell us who it's for. MUSE suggests gift concepts across every product.</span>
          </span>
          <IconArrowRight className="h-4 w-4 shrink-0 text-clay-deep transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
