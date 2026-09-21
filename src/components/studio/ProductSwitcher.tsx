import { useState } from "react";
import { useDesign } from "../../lib/store";
import { PRODUCTS, type ProductId } from "../../data/products";
import { COLORS, colorById } from "../../data/catalog";
import ProductStage from "../products/ProductStage";
import { track } from "../../lib/analytics";
import { IconChevronDown, IconClose } from "../icons";

/** True when the current design has anything worth protecting — gates whether switching products needs to ask first. */
function hasWorkInProgress(design: ReturnType<typeof useDesign>): boolean {
  return Boolean(design.artwork || design.text?.content || design.strokesFront.length > 0 || design.strokesBack.length > 0);
}

export default function ProductSwitcher({ className = "" }: { className?: string }) {
  const design = useDesign();
  const [open, setOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ProductId | null>(null);

  if (!design.garment) return null;
  const current = PRODUCTS.find((p) => p.id === design.garment)!;

  const requestSwitch = (id: ProductId) => {
    if (id === design.garment) {
      setOpen(false);
      return;
    }
    setOpen(false);
    if (hasWorkInProgress(design)) {
      setPendingProduct(id);
    } else {
      design.setGarment(id);
      track("garment_selected", { garment: id, via: "switcher" });
    }
  };

  const adaptDesign = () => {
    if (!pendingProduct) return;
    design.setGarment(pendingProduct);
    track("garment_selected", { garment: pendingProduct, via: "switcher_adapt" });
    setPendingProduct(null);
  };

  const startFreshWith = () => {
    if (!pendingProduct) return;
    design.startFresh();
    design.setGarment(pendingProduct);
    track("garment_selected", { garment: pendingProduct, via: "switcher_fresh" });
    setPendingProduct(null);
  };

  return (
    <div className={`relative ${className}`}>
      <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">Product</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left transition-colors hover:border-[#c8a96b]/60"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ivory-dim">
            <ProductStage product={current.id} colorHex={colorById(design.color).hex} view="front" variants={design.variants} className="h-full w-full" />
          </span>
          <span className="font-display text-base text-ink">{current.label}</span>
        </span>
        <IconChevronDown className={`h-4 w-4 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-line-soft bg-paper p-3 shadow-[0_30px_70px_-30px_rgba(36,31,26,0.35)] animate-scale-in sm:grid-cols-3">
            {PRODUCTS.map((p) => {
              const isActive = p.id === current.id;
              return (
                <button
                  key={p.id}
                  onClick={() => requestSwitch(p.id)}
                  className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${
                    isActive ? "border-[#241f1a] bg-ivory-dim" : "border-transparent hover:border-line hover:bg-ivory-dim/60"
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center">
                    <ProductStage product={p.id} colorHex={COLORS[1].hex} view="front" variants={{}} className="h-full w-full" />
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-ink">{p.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {pendingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-5 animate-fade-in" onClick={() => setPendingProduct(null)}>
          <div
            className="w-full max-w-sm rounded-3xl border border-line-soft bg-paper p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <p className="font-display text-xl text-ink">
                Adapt your design to {PRODUCTS.find((p) => p.id === pendingProduct)!.label}?
              </p>
              <button onClick={() => setPendingProduct(null)} className="ml-3 shrink-0 text-ink-faint hover:text-ink" aria-label="Cancel">
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">
              You've already started designing. We can carry your artwork and text over, or clear the canvas and start this product fresh.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={adaptDesign}
                className="w-full rounded-full bg-[#c8a96b] py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#241f1a] transition-transform hover:-translate-y-0.5"
              >
                Adapt Design
              </button>
              <button
                onClick={startFreshWith}
                className="w-full rounded-full border border-line py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
