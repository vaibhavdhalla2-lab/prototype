import { useRef, useState } from "react";
import { GARMENTS, colorById, materialById, fitById } from "../../data/catalog";
import type { GarmentType } from "../../data/catalog";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";
import { IconUpload, IconSparkle, IconCheck } from "../icons";

interface Analysis {
  fit: "oversized";
  color: "black";
  material: "heavyweight-cotton";
  graphic: string;
}

export default function EntryUpload({ onEnterStudio }: { onEnterStudio: (tab: string) => void }) {
  const design = useDesign();
  const fileRef = useRef<HTMLInputElement>(null);
  const [garment, setGarment] = useState<GarmentType>(design.garment ?? "tshirt");
  const [staged, setStaged] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setStaged(reader.result as string);
      track("uploaded_image", { name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const useAsArtwork = () => {
    if (!staged) return;
    design.setGarment(garment);
    design.setArtwork({ src: staged, x: 0.5, y: 0.5, scale: 1, rotation: 0 });
    design.setSourceMode("upload");
    onEnterStudio("image");
  };

  const useAsInspiration = () => {
    setAnalysis({ fit: "oversized", color: "black", material: "heavyweight-cotton", graphic: "Front Print" });
    track("opened_muse", { context: "inspiration" });
  };

  const applyRecommendations = () => {
    if (!analysis) return;
    design.setGarment(garment);
    design.setFit(analysis.fit);
    design.setColor(analysis.color);
    design.setMaterial(analysis.material);
    design.setSourceMode("upload");
    onEnterStudio("design");
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">Upload an image</p>
      <h1 className="text-center font-display text-4xl text-ink animate-fade-up [animation-delay:60ms]">Have something in mind?</h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-ink-soft animate-fade-up [animation-delay:120ms]">Show us — MUSE can turn it into artwork or use it purely as inspiration.</p>

      {!analysis && (
        <div className="mt-9 animate-fade-up [animation-delay:180ms]">
          <p className="mb-2.5 text-center text-[11px] uppercase tracking-[0.2em] text-ink-faint">Canvas</p>
          <div className="flex justify-center gap-2">
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGarment(g.id)}
                className={`rounded-full border px-4 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
                  garment === g.id ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!staged && !analysis && (
        <div className="mt-8 animate-fade-up [animation-delay:240ms]">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-line-soft bg-paper px-6 py-16 text-center transition-colors hover:border-ink-soft"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ivory">
              <IconUpload className="h-5 w-5 text-ink-soft" />
            </span>
            <span className="text-sm text-ink-soft">Drop an image or click to browse</span>
            <span className="text-[11px] text-ink-faint">PNG or JPG, up to 10MB</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-faint">
            Only upload artwork or images you own or have permission to use commercially.
          </p>
        </div>
      )}

      {staged && !analysis && (
        <div className="mt-8 animate-scale-in">
          <img src={staged} alt="Uploaded" className="mx-auto h-56 w-56 rounded-2xl object-cover shadow-[0_20px_50px_-24px_rgba(26,23,18,0.4)]" />
          <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2.5">
            <button onClick={useAsArtwork} className="rounded-full bg-ink py-3 text-[12px] uppercase tracking-[0.12em] text-ivory">
              Use As Artwork
            </button>
            <button onClick={useAsInspiration} className="flex items-center justify-center gap-2 rounded-full border border-clay/40 py-3 text-[12px] uppercase tracking-[0.12em] text-clay-deep">
              <IconSparkle className="h-3.5 w-3.5" /> Use As Inspiration
            </button>
            <button onClick={() => setStaged(null)} className="py-2 text-[12px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
              Choose a different image
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-8 animate-scale-in rounded-3xl border border-clay/30 bg-clay/[0.06] p-6">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-clay-deep">
            <IconSparkle className="h-3.5 w-3.5" /> Muse analysis
          </p>
          {staged && <img src={staged} alt="Reference" className="mt-4 h-40 w-full rounded-xl object-cover" />}
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            I see a relaxed silhouette, a monochrome palette and a graphic-heavy front.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-paper p-4 text-[13px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Fit</p>
              <p className="text-ink">{fitById(analysis.fit).label}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Colour</p>
              <p className="text-ink">Washed {colorById(analysis.color).label}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Material</p>
              <p className="text-ink">{materialById(analysis.material).label}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Graphic</p>
              <p className="text-ink">{analysis.graphic}</p>
            </div>
          </div>
          <button onClick={applyRecommendations} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[12px] uppercase tracking-[0.14em] text-ivory">
            <IconCheck className="h-4 w-4" /> Apply Recommendations
          </button>
        </div>
      )}
    </div>
  );
}
