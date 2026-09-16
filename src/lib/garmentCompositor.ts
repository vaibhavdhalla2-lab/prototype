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
function midLuminance(base: ImageData, mask: ImageData): number {
  const bd = base.data;
  const md = mask.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < bd.length; i += 4) {
    if (bd[i + 3] === 0 || md[i + 3] === 0) continue;
    sum += luminance01(bd[i], bd[i + 1], bd[i + 2]);
    count++;
  }
  return count > 0 ? sum / count : 0.5;
}

/**
 * Recolors base.png within mask.png's non-transparent region, preserving
 * every fold/seam/weave-texture variation as relative light and dark.
 * Pixels outside the mask (but inside the garment's own alpha) keep their
 * original photographed color untouched — e.g. a contrast-stitched collar
 * that shouldn't follow the body color. Pixels outside the garment stay
 * fully transparent.
 */
function recolorBase(baseImg: HTMLImageElement, maskImg: HTMLImageElement, colorHex: string): HTMLCanvasElement {
  const w = baseImg.naturalWidth;
  const h = baseImg.naturalHeight;

  const base = drawToImageData(baseImg, w, h);
  const mask = drawToImageData(maskImg, w, h);
  const baseMid = luminanceCache.get(baseImg) ?? midLuminance(base, mask);
  luminanceCache.set(baseImg, baseMid);

  const [cr, cg, cb] = hexToRgb01(colorHex);
  const bd = base.data;
  const md = mask.data;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d")!;
  const out = outCtx.createImageData(w, h);
  const od = out.data;

  for (let i = 0; i < bd.length; i += 4) {
    const baseAlpha = bd[i + 3];
    if (baseAlpha === 0) {
      od[i + 3] = 0;
      continue;
    }

    const maskAlpha = md[i + 3] / 255;
    if (maskAlpha <= 0) {
      od[i] = bd[i];
      od[i + 1] = bd[i + 1];
      od[i + 2] = bd[i + 2];
      od[i + 3] = baseAlpha;
      continue;
    }

    const l = luminance01(bd[i], bd[i + 1], bd[i + 2]);
    const lNorm = clamp01(0.5 + (l - baseMid) * CONTRAST);

    const rr = softLight(cr, lNorm) * 255;
    const gg = softLight(cg, lNorm) * 255;
    const bb = softLight(cb, lNorm) * 255;

    // Feather by mask alpha so anti-aliased mask edges don't produce a hard seam.
    od[i] = bd[i] + (rr - bd[i]) * maskAlpha;
    od[i + 1] = bd[i + 1] + (gg - bd[i + 1]) * maskAlpha;
    od[i + 2] = bd[i + 2] + (bb - bd[i + 2]) * maskAlpha;
    od[i + 3] = baseAlpha;
  }

  outCtx.putImageData(out, 0, 0);
  return outCanvas;
}

/** Recolors (and caches) base+mask for a given color — the expensive pixel pass only runs once per combination. */
export async function getRecoloredBase(baseSrc: string, maskSrc: string, colorHex: string): Promise<HTMLCanvasElement> {
  const key = `${baseSrc}|${maskSrc}|${colorHex.toLowerCase()}`;
  const cached = recolorCache.get(key);
  if (cached) return cached;

  const [baseImg, maskImg] = await Promise.all([loadImageCached(baseSrc), loadImageCached(maskSrc)]);
  const canvas = recolorBase(baseImg, maskImg, colorHex);
  recolorCache.set(key, canvas);
  return canvas;
}

function containFit(srcW: number, srcH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}

export interface DrawGarmentOptions {
  recoloredBase: HTMLCanvasElement;
  shadows?: HTMLImageElement | null;
  highlights?: HTMLImageElement | null;
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
