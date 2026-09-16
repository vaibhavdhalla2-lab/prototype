/**
 * Canvas-based photographic garment recoloring.
 *
 * Pipeline (per the layer stack this is designed to grow into):
 *
 *   highlights                  <- drawn last, blend "screen"
 *   shadows                     <- drawn above the colored base, blend "multiply"
 *   [future: user artwork]      <- would slot in here, before shadows
 *   garment color + base fabric <- recolored in one pass, see recolorBase()
 *
 * The recolor step never flattens the source photo to a solid fill. It reads
 * each pixel's own luminance from base.png as a per-pixel "how light or dark
 * is this bit of fabric" signal, then blends the target color against that
 * signal with the W3C soft-light formula — the same math Photoshop's
 * "Soft Light" blend mode uses. A pixel in a deep fold stays darker than the
 * flat target color; a pixel catching studio light stays lighter. Folds,
 * seams and weave texture all survive because they're baked into that
 * luminance signal, not into the flat color.
 *
 * Everything here is plain Canvas 2D + typed-array pixel math — no CSS
 * filters, no WebGL, no image generation.
 */

const luminanceCache = new WeakMap<HTMLImageElement, number>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const recolorCache = new Map<string, HTMLCanvasElement>();

/** How strongly the base photo's own shadows/highlights push away from the flat target color. */
const CONTRAST = 1.15;

/**
 * The shipped exports (base.png/shadow.png/highlight.png) aren't transparent
 * everywhere outside the shirt — pixel-sampling them found a uniform,
 * semi-opaque studio-backdrop wash filling their full canvas rectangle
 * (base ~alpha 51/255, shadow ~8/255, highlight ~128/255) surrounding a
 * fully-opaque (alpha 255) garment. Left alone, the highlight layer's ~50%
 * wash alone renders as a visible pale rectangle behind the shirt. Any raw
 * alpha at or below this cutoff is treated as "not garment"; true fabric
 * pixels sit far above it, so the real silhouette (edges included) survives.
 */
const BACKDROP_ALPHA_CUTOFF = 90;

function thresholdAlpha(rawAlpha: number): number {
  if (rawAlpha <= BACKDROP_ALPHA_CUTOFF) return 0;
  return Math.round(((rawAlpha - BACKDROP_ALPHA_CUTOFF) / (255 - BACKDROP_ALPHA_CUTOFF)) * 255);
}

export function loadImageCached(src: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load "${src}" — check the file exists in /public.`));
      img.src = src;
    });
    imageCache.set(src, pending);
  }
  return pending;
}

/** Fire-and-forget warmup so a later color swap or mount has zero network wait. */
export function preloadGarmentAssets(paths: Array<string | undefined>): void {
  for (const src of paths) {
    if (src) loadImageCached(src).catch(() => undefined);
  }
}

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

function luminance01(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** W3C compositing-spec soft-light formula: cb = backdrop (target color) channel, cs = source (light map) value. */
function softLight(cb: number, cs: number): number {
  if (cs <= 0.5) return cb - (1 - 2 * cs) * cb * (1 - cb);
  const d = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb);
  return cb + (2 * cs - 1) * (d - cb);
}

function drawToImageData(img: HTMLImageElement, w: number, h: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * The base photo's own average tone, sampled only where the mask says
 * "fabric" — so a dark collar rib sitting outside the mask can't skew it.
 * Normalizing around this (rather than a fixed 0.5) means the recolor looks
 * right whether the source photo was shot bright and high-key or more
 * neutrally lit; the *relative* shading is what gets preserved either way.
 */
function midLuminance(base: ImageData): number {
  const bd = base.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < bd.length; i += 4) {
    if (bd[i + 3] <= BACKDROP_ALPHA_CUTOFF) continue;
    sum += luminance01(bd[i], bd[i + 1], bd[i + 2]);
    count++;
  }
  return count > 0 ? sum / count : 0.5;
}

/**
 * Recolors base.png's own non-transparent region, preserving every
 * fold/seam/weave-texture variation as relative light and dark. Pixels
 * outside the garment (base alpha 0) stay fully transparent.
 *
 * mask.png is loaded and its alpha is available (`maskAlpha` below) for a
 * garment that legitimately needs to protect part of its own silhouette
 * from recoloring — e.g. a contrast-stitched collar on a future two-tone
 * hoodie. It is *not* used to gate the T-shirt recolor region here: measured
 * against the actual shipped assets, mask.png's silhouette sits tens to
 * ~150px (of 4500px) off from base.png's at several scanlines, non-uniformly
 * — a real export/alignment mismatch, not anti-aliasing noise. Since this
 * garment is a single uniform fabric with nothing that should stay
 * unrecolored, gating on that mask would just punch an unrecolored hole
 * wherever it falls short of base's true silhouette (exactly the white
 * sleeve patch seen in testing). Using base's own — inherently self-aligned
 * — alpha as the region instead fixes that outright. If a future garment
 * needs true partial exclusion, re-enable the `maskAlpha <=` gate below once
 * that garment's mask is verified pixel-aligned to its base.
 */
function recolorBase(baseImg: HTMLImageElement, colorHex: string): HTMLCanvasElement {
  const w = baseImg.naturalWidth;
  const h = baseImg.naturalHeight;

  const base = drawToImageData(baseImg, w, h);
  const baseMid = luminanceCache.get(baseImg) ?? midLuminance(base);
  luminanceCache.set(baseImg, baseMid);

  const [cr, cg, cb] = hexToRgb01(colorHex);
  const bd = base.data;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d")!;
  const out = outCtx.createImageData(w, h);
  const od = out.data;

  for (let i = 0; i < bd.length; i += 4) {
    const baseAlpha = thresholdAlpha(bd[i + 3]);
    if (baseAlpha === 0) {
      od[i + 3] = 0;
      continue;
    }

    const l = luminance01(bd[i], bd[i + 1], bd[i + 2]);
    const lNorm = clamp01(0.5 + (l - baseMid) * CONTRAST);

    const rr = softLight(cr, lNorm) * 255;
    const gg = softLight(cg, lNorm) * 255;
    const bb = softLight(cb, lNorm) * 255;

    od[i] = rr;
    od[i + 1] = gg;
    od[i + 2] = bb;
    od[i + 3] = baseAlpha;
  }

  outCtx.putImageData(out, 0, 0);
  return outCanvas;
}

/**
 * Recolors (and caches) base for a given color — the expensive pixel pass
 * only runs once per combination. `maskSrc` is still loaded (so a missing
 * mask file surfaces as a clear load error) but its content currently isn't
 * used to gate the recolor region — see the comment on recolorBase().
 */
export async function getRecoloredBase(baseSrc: string, maskSrc: string, colorHex: string): Promise<HTMLCanvasElement> {
  const key = `${baseSrc}|${colorHex.toLowerCase()}`;
  const cached = recolorCache.get(key);
  if (cached) return cached;

  const [baseImg] = await Promise.all([loadImageCached(baseSrc), loadImageCached(maskSrc)]);
  const canvas = recolorBase(baseImg, colorHex);
  recolorCache.set(key, canvas);
  return canvas;
}

const shapeCache = new Map<string, Promise<HTMLCanvasElement>>();
const maskedLayerCache = new Map<string, Promise<HTMLCanvasElement>>();

/**
 * A plain white silhouette stencil — alpha-only, thresholded the same way as
 * recolorBase() — independent of target color. Used to clip the shadow/
 * highlight layers to the real garment shape instead of whatever backdrop
 * wash their own export canvas happens to carry (see BACKDROP_ALPHA_CUTOFF).
 */
function getGarmentShape(baseSrc: string): Promise<HTMLCanvasElement> {
  let pending = shapeCache.get(baseSrc);
  if (!pending) {
    pending = loadImageCached(baseSrc).then((baseImg) => {
      const w = baseImg.naturalWidth;
      const h = baseImg.naturalHeight;
      const base = drawToImageData(baseImg, w, h);
      const bd = base.data;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      const out = ctx.createImageData(w, h);
      const od = out.data;
      for (let i = 0; i < bd.length; i += 4) {
        od[i] = 255;
        od[i + 1] = 255;
        od[i + 2] = 255;
        od[i + 3] = thresholdAlpha(bd[i + 3]);
      }
      ctx.putImageData(out, 0, 0);
      return canvas;
    });
    shapeCache.set(baseSrc, pending);
  }
  return pending;
}

/**
 * Loads a shadow/highlight mockup layer and clips it to the garment's real
 * silhouette (derived from base.png), so its own backdrop wash never shows.
 * Cached per (layer, base) pair — the clip shape doesn't depend on color.
 */
export function getMaskedLayer(layerSrc: string, baseSrc: string): Promise<HTMLCanvasElement> {
  const key = `${layerSrc}|${baseSrc}`;
  let pending = maskedLayerCache.get(key);
  if (!pending) {
    pending = Promise.all([loadImageCached(layerSrc), getGarmentShape(baseSrc)]).then(([layerImg, shape]) => {
      const canvas = document.createElement("canvas");
      canvas.width = shape.width;
      canvas.height = shape.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(layerImg, 0, 0, shape.width, shape.height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(shape, 0, 0);
      return canvas;
    });
    maskedLayerCache.set(key, pending);
  }
  return pending;
}

function containFit(srcW: number, srcH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}

export interface DrawGarmentOptions {
  recoloredBase: HTMLCanvasElement;
  shadows?: HTMLCanvasElement | HTMLImageElement | null;
  highlights?: HTMLCanvasElement | HTMLImageElement | null;
  shadowBlendMode: GlobalCompositeOperation;
  highlightBlendMode: GlobalCompositeOperation;
  dpr: number;
}

/**
 * Draws the composited garment into `canvas`, sized to the canvas element's
 * current CSS box (so it fills whatever product-card area it's placed in)
 * at `dpr` device pixels per CSS pixel for crisp Retina/HiDPI rendering.
 * The source bitmap is always scaled with "contain" math — never stretched,
 * always centered, aspect ratio intact.
 */
export function drawGarmentToCanvas(canvas: HTMLCanvasElement, opts: DrawGarmentOptions): void {
  const { recoloredBase, shadows, highlights, shadowBlendMode, highlightBlendMode, dpr } = opts;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) return;

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, cssW, cssH);

  const { dx, dy, dw, dh } = containFit(recoloredBase.width, recoloredBase.height, cssW, cssH);

  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(recoloredBase, dx, dy, dw, dh);

  if (shadows) {
    ctx.globalCompositeOperation = shadowBlendMode;
    ctx.drawImage(shadows, dx, dy, dw, dh);
  }
  if (highlights) {
    ctx.globalCompositeOperation = highlightBlendMode;
    ctx.drawImage(highlights, dx, dy, dw, dh);
  }
  ctx.globalCompositeOperation = "source-over";
}
