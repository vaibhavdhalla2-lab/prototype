import { useRef, useState } from "react";
import { useDesign, type ImageLayer } from "../../lib/store";
import { track } from "../../lib/analytics";
import { designsFor } from "../../data/designs.generated";
import { IconUpload, IconSparkle, IconCopy, IconTrash, IconRotateCw, IconInfo } from "../icons";

function Slider({ value, min, max, step = 1, onChange, format }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-line accent-[#241f1a]"
      />
      <span className="w-12 shrink-0 text-right text-[11.5px] tabular-nums text-ink-soft">{format ? format(value) : value}</span>
    </div>
  );
}

/** Resolution guidance — a rough, honest heuristic (no real print-DPI pipeline exists in this prototype) rather than blocking creation outright. */
function resolutionQuality(layer: ImageLayer): { good: boolean; label: string } {
  const shortSide = Math.min(layer.naturalWidth || 0, layer.naturalHeight || 0);
  const effective = shortSide / Math.max(layer.scale, 0.5);
  if (!shortSide) return { good: true, label: "Resolution unknown" };
  if (effective >= 700) return { good: true, label: "High resolution — good for printing" };
  return { good: false, label: "Low resolution — may appear blurry at this size" };
}

export default function ImagePanel() {
  const design = useDesign();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ src: string; w: number; h: number } | null>(null);

  if (!design.garment) return null;
  const side = design.view === "back" ? "back" : "front";
  const layers = design.layersFor(side).filter((l): l is ImageLayer => l.type === "image");
  const selected = layers.find((l) => l.id === design.selectedLayerId) ?? null;
  const studioPrints = designsFor("tshirt");

  const readFile = (file: File, cb: (src: string, w: number, h: number) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => cb(src, img.naturalWidth, img.naturalHeight);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (file: File) => {
    readFile(file, (src, w, h) => {
      setStaged({ src, w, h });
      track("image_uploaded", { name: file.name });
    });
  };

  const useAsArtwork = () => {
    if (!staged) return;
    design.addImageLayer(side, staged.src, { naturalWidth: staged.w, naturalHeight: staged.h });
    setStaged(null);
  };

  const pickStudioPrint = (src: string, name: string) => {
    design.addImageLayer(side, src, { naturalWidth: 1200, naturalHeight: 1200 });
    track("studio_print_selected", { name });
  };

  const replaceImage = (file: File) => {
    if (!selected) return;
    readFile(file, (src, w, h) => {
      design.updateLayer<ImageLayer>(selected.id, { src, naturalWidth: w, naturalHeight: h });
    });
  };

  const update = (patch: Partial<ImageLayer>) => {
    if (!selected) return;
    design.updateLayer<ImageLayer>(selected.id, patch);
  };

  if (selected) {
    const quality = resolutionQuality(selected);
    return (
      <div className="animate-fade-in space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Editing image</p>
          <button onClick={() => design.selectLayer(null)} className="text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft">
            Done
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
          <img src={selected.src} alt="Selected artwork" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">On canvas</p>
            <p className={`flex items-center gap-1 text-[11.5px] ${quality.good ? "text-ink-soft" : "text-clay-deep"}`}>
              <IconInfo className="h-3 w-3 shrink-0" /> {quality.label}
            </p>
          </div>
        </div>
        <p className="-mt-3 text-[12px] text-ink-soft">Drag on the product to move · corner handle to scale · top handle to rotate.</p>

        <button
          onClick={() => update({ rotation: (selected.rotation + 90) % 360 })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft"
        >
          <IconRotateCw className="h-4 w-4" /> Rotate 90°
        </button>

        <div>
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Brightness</p>
          <Slider value={selected.brightness} min={40} max={160} onChange={(v) => update({ brightness: v })} format={(v) => `${v}%`} />
        </div>
        <div>
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Contrast</p>
          <Slider value={selected.contrast} min={40} max={160} onChange={(v) => update({ contrast: v })} format={(v) => `${v}%`} />
        </div>
        <div>
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Saturation</p>
          <Slider value={selected.saturation} min={0} max={200} onChange={(v) => update({ saturation: v })} format={(v) => `${v}%`} />
        </div>
        <div>
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">Transparency</p>
          <Slider value={Math.round(selected.opacity * 100)} min={10} max={100} onChange={(v) => update({ opacity: v / 100 })} format={(v) => `${v}%`} />
        </div>

        <button
          onClick={() => update({ grayscale: !selected.grayscale })}
          className={`w-full rounded-xl border py-2.5 text-[12px] uppercase tracking-[0.08em] transition-colors ${
            selected.grayscale ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-ink-soft"
          }`}
        >
          Grayscale {selected.grayscale ? "On" : "Off"}
        </button>

        <div className="flex gap-2 border-t border-line-soft pt-4">
          <button onClick={() => replaceRef.current?.click()} className="flex-1 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft">
            Replace
          </button>
          <button
            onClick={() => design.duplicateLayer(selected.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft"
          >
            <IconCopy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button
            onClick={() => design.removeLayer(selected.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12px] text-ink-soft hover:border-ink-soft"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
        <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && replaceImage(e.target.files[0])} />
      </div>
    );
  }

  if (staged) {
    return (
      <div className="animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Image</p>
        <img src={staged.src} alt="Uploaded" className="mt-3 h-40 w-full rounded-xl object-cover" />
        <p className="mt-2 text-[11.5px] text-ink-faint">
          {staged.w}×{staged.h}px
        </p>
        <div className="mt-4 space-y-2">
          <button onClick={useAsArtwork} className="w-full rounded-xl border border-[#241f1a] bg-[#c8a96b] py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#241f1a]">
            Add To Canvas
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
      {layers.length > 0 && (
        <div className="mt-4 space-y-2">
          {layers.map((l) => (
            <button
              key={l.id}
              onClick={() => design.selectLayer(l.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-line p-2 text-left transition-colors hover:border-ink-soft"
            >
              <img src={l.src} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-sm text-ink">{l.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-line-soft bg-ivory-dim px-6 py-10 text-center transition-colors hover:border-ink-soft"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper">
          <IconUpload className="h-4.5 w-4.5 text-ink-soft" />
        </span>
        <span className="text-sm text-ink-soft">Drop an image or click to browse</span>
        <span className="text-[11px] text-ink-faint">PNG, JPG or WEBP, up to 10MB</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

      {studioPrints.length > 0 && (
        <div className="mt-8">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            <IconSparkle className="h-3.5 w-3.5" /> Or start from a MUSE print
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {studioPrints.map((p) => (
              <button
                key={p.id}
                onClick={() => pickStudioPrint(p.image, p.name)}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-line p-2 text-center transition-colors hover:border-[#241f1a]/50"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink/90">
                  <img src={p.image} alt={p.name} className="h-11 w-11 object-contain" />
                </span>
                <span className="line-clamp-2 text-[10px] leading-tight text-ink-soft group-hover:text-ink">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-ink-faint">
        Only upload artwork or images you own or have permission to use commercially. Designs containing
        third-party copyrighted or trademarked material may not be eligible for marketplace publication.
      </p>
    </div>
  );
}
