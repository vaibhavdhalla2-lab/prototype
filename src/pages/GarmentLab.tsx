import { useEffect, useState } from "react";
import GarmentPreview from "../components/garment/GarmentPreview";
import GarmentColorSwatches from "../components/garment/GarmentColorSwatches";
import { garmentColors } from "../lib/garmentColors";
import { preloadGarmentAssets } from "../lib/garmentCompositor";
import { resolveGarmentAssets } from "../lib/garmentAssets";
import { designsFor } from "../data/designs.generated";

export default function GarmentLab() {
  const [color, setColor] = useState(garmentColors[0].value);
  const designs = designsFor("tshirt");
  const [designId, setDesignId] = useState<string | null>(designs[0]?.id ?? null);
  const activeDesign = designs.find((d) => d.id === designId);

  useEffect(() => {
    const assets = resolveGarmentAssets("tshirt", "front");
    if (assets) preloadGarmentAssets([assets.base, assets.mask, assets.shadows, assets.highlights]);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint">Garment Preview</p>
      <h1 className="text-center font-display text-4xl text-ink sm:text-5xl">Realistic recoloring, in the browser.</h1>
      <p className="mx-auto mt-4 max-w-md text-center text-ink-soft">
        Canvas-composited from a single photographed T-shirt — no filters, no illustration.
      </p>

      <div className="mx-auto mt-12 aspect-square w-full max-w-md rounded-[28px] border border-line-soft bg-paper p-8 shadow-[0_30px_80px_-45px_rgba(26,23,18,0.35)]">
        <GarmentPreview garment="tshirt" color={color} design={activeDesign?.image} className="h-full w-full" alt="FORMÉ T-shirt preview" />
      </div>

      <div className="mt-8">
        <GarmentColorSwatches value={color} onChange={setColor} />
      </div>

      {designs.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setDesignId(null)}
            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] ${!designId ? "border-[#351c45] bg-[#351c45] text-[#d4af70]" : "border-line text-ink-soft"}`}
          >
            No print
          </button>
          {designs.map((d) => (
            <button
              key={d.id}
              onClick={() => setDesignId(d.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] ${designId === d.id ? "border-[#351c45] bg-[#351c45] text-[#d4af70]" : "border-line text-ink-soft"}`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
