import { useRef, useState } from "react";
import { useDesign } from "../../lib/store";
import { track } from "../../lib/analytics";
import { colorById, materialById, fitById } from "../../data/catalog";
import { IconUpload, IconSparkle, IconCheck } from "../icons";

interface Analysis {
  fit: "oversized";
  color: "black";
  material: "heavyweight-cotton";
  graphic: string;
}

export default function ImagePanel() {
  const design = useDesign();
  const fileRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setStaged(reader.result as string);
      setAnalysis(null);
      track("image_uploaded", { name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const useAsArtwork = () => {
    if (!staged) return;
    design.setArtwork({ src: staged, x: 0.5, y: 0.5, scale: 1, rotation: 0 });
    setStaged(null);
    setAnalysis(null);
  };

  const useAsInspiration = () => {
    setAnalysis({ fit: "oversized", color: "black", material: "heavyweight-cotton", graphic: "Front Print" });
    track("muse_opened", { context: "inspiration" });
  };

  const applyRecommendations = () => {
    if (!analysis) return;
    design.setFit(analysis.fit);
    design.setColor(analysis.color);
    design.setMaterial(analysis.material);
    track("muse_recommendation_used", { context: "inspiration" });
    setAnalysis(null);
    setStaged(null);
  };

  if (design.artwork) {
    return (
      <div className="animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Image</p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3">
          <img src={design.artwork.src} alt="Uploaded artwork" className="h-16 w-16 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">On canvas</p>
            <p className="text-[12px] text-ink-soft">Drag it on the garment to move. Use the handles to resize or rotate.</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl border border-line py-2.5 text-[12px] uppercase tracking-[0.08em] text-ink-soft hover:border-ink-soft"
          >
            Replace
          </button>
          <button
            onClick={() => design.setArtwork(null)}
            className="flex-1 rounded-xl border border-line py-2.5 text-[12px] uppercase tracking-[0.08em] text-ink-soft hover:border-ink-soft"
          >
            Remove
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <IconSparkle className="h-4 w-4 text-clay-deep" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-clay-deep">Muse analysis</p>
        </div>
        {staged && <img src={staged} alt="Reference" className="mt-3 h-32 w-full rounded-xl object-cover" />}
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          I see a relaxed silhouette, a monochrome palette and a graphic-heavy front.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-line-soft bg-ivory-dim p-4 text-[13px]">
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
        <button onClick={applyRecommendations} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[12px] uppercase tracking-[0.14em] text-ivory">
          <IconCheck className="h-4 w-4" /> Apply Recommendations
        </button>
        <button onClick={() => setAnalysis(null)} className="mt-2 w-full py-2 text-[12px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
          Back
        </button>
      </div>
    );
  }

  if (staged) {
    return (
      <div className="animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Image</p>
        <img src={staged} alt="Uploaded" className="mt-3 h-40 w-full rounded-xl object-cover" />
        <div className="mt-4 space-y-2">
          <button onClick={useAsArtwork} className="w-full rounded-xl border border-ink bg-ink py-2.5 text-[12px] uppercase tracking-[0.1em] text-ivory">
            Use As Artwork
          </button>
          <button onClick={useAsInspiration} className="flex w-full items-center justify-center gap-2 rounded-xl border border-clay/40 py-2.5 text-[12px] uppercase tracking-[0.1em] text-clay-deep">
            <IconSparkle className="h-3.5 w-3.5" /> Use As Inspiration
          </button>
          <button onClick={() => setStaged(null)} className="w-full py-2 text-[12px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
            Choose a different image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Upload an image</p>
      <p className="mt-1 text-sm text-ink-soft">Have something in mind? Show us.</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-line-soft bg-ivory-dim px-6 py-10 text-center transition-colors hover:border-ink-soft"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper">
          <IconUpload className="h-4.5 w-4.5 text-ink-soft" />
        </span>
        <span className="text-sm text-ink-soft">Drop an image or click to browse</span>
        <span className="text-[11px] text-ink-faint">PNG or JPG, up to 10MB</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

      <p className="mt-6 text-[12px] leading-relaxed text-ink-faint">
        Only upload artwork or images you own or have permission to use commercially. Designs containing
        third-party copyrighted or trademarked material may not be eligible for marketplace publication.
      </p>
    </div>
  );
}
