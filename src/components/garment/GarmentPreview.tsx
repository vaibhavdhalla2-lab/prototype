import { useCallback, useEffect, useRef, useState } from "react";
import { drawGarmentToCanvas, getRecoloredBase, loadImageCached } from "../../lib/garmentCompositor";
import { GARMENT_ASSET_REGISTRY, type GarmentKind } from "../../lib/garmentAssets";

export interface GarmentPreviewProps {
  /** Looks up base/mask/shadows/highlights from the registry in garmentAssets.ts. */
  garment?: GarmentKind;
  /** Target garment color as a hex string, e.g. "#182130". */
  color: string;
  /** Individually override any asset path instead of (or in addition to) `garment`. */
  base?: string;
  mask?: string;
  shadows?: string;
  highlights?: string;
  /** Defaults match how real shadow/highlight mockup layers are meant to be composited. */
  shadowBlendMode?: GlobalCompositeOperation;
  highlightBlendMode?: GlobalCompositeOperation;
  className?: string;
  alt?: string;
}

type Status = "loading" | "ready" | "error";

/**
 * Photographic, dynamically-recolorable garment preview rendered with Canvas
 * compositing (see src/lib/garmentCompositor.ts) — not CSS filters, not an
 * illustration. Fills whatever box it's placed in (aspect ratio preserved,
 * never stretched); give it a sized parent, same as an <img>.
 */
export default function GarmentPreview({
  garment,
  color,
  base: baseOverride,
  mask: maskOverride,
  shadows: shadowsOverride,
  highlights: highlightsOverride,
  shadowBlendMode = "multiply",
  highlightBlendMode = "screen",
  className,
  alt = "Garment preview",
}: GarmentPreviewProps) {
  const preset = garment ? GARMENT_ASSET_REGISTRY[garment] : undefined;
  const base = baseOverride ?? preset?.base;
  const mask = maskOverride ?? preset?.mask;
  const shadows = shadowsOverride ?? preset?.shadows;
  const highlights = highlightsOverride ?? preset?.highlights;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const redraw = useCallback(async () => {
    if (!base || !mask || !canvasRef.current) return;
    try {
      const recolored = await getRecoloredBase(base, mask, color);
      const [shadowImg, highlightImg] = await Promise.all([
        shadows ? loadImageCached(shadows).catch(() => null) : Promise.resolve(null),
        highlights ? loadImageCached(highlights).catch(() => null) : Promise.resolve(null),
      ]);
      if (!canvasRef.current) return;
      drawGarmentToCanvas(canvasRef.current, {
        recoloredBase: recolored,
        shadows: shadowImg,
        highlights: highlightImg,
        shadowBlendMode,
        highlightBlendMode,
        dpr: window.devicePixelRatio || 1,
      });
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to render garment.");
    }
  }, [base, mask, shadows, highlights, color, shadowBlendMode, highlightBlendMode]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Re-composite on container resize so the canvas backing store always matches its CSS box (crisp on HiDPI).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [redraw]);

  if (!base || !mask) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-line-soft bg-ivory-dim p-6 text-center text-[12px] text-ink-faint ${className ?? ""}`}
      >
        No garment assets configured{garment ? ` for "${garment}"` : ""}.
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="h-full w-full transition-opacity duration-300 ease-out"
        style={{ opacity: status === "ready" ? 1 : 0 }}
      />
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-clay/40 bg-clay/[0.05] p-4 text-center text-[12px] text-clay-deep">
          Couldn't load garment assets.
          <br />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
