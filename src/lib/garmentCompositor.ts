/**
 * Canvas-based photographic garment recoloring.
 *
 * Pipeline:
 *
 *   highlights   <- drawn last, blend "screen", very low strength (see HIGHLIGHT_STRENGTH)
 *   shadows      <- drawn above the recolored base, blend "multiply", low strength (see SHADOW_STRENGTH)
 *   [future: user artwork] <- would slot in here, before shadows
 *   recolored base fabric  <- the photograph itself, see recolorBase()
 *
 * The base photograph is the primary visual layer, not a light map to be
 * amplified. recolorBase() converts the photo to grayscale — that grayscale
 * *is* the photographed light/shadow map, used completely untouched — then
 * multiplies the flat target color through it. A pixel in a deep fold stays
 * proportionally darker than the flat target color; a pixel catching soft
 * studio light stays proportionally lighter. Nothing renormalizes or
 * stretches that brightness range, which is what previously produced a
 * shiny/satin look: contrast-amplifying the photo's luminance before
 * recoloring exaggerated bright spots into looking like specular highlights
 * on synthetic fabric. The shadows/highlights mockup layers are then
 * composited on top at deliberately low opacity — depth reinforcement, not
 * the main light source.
 *
 * Everything here is plain Canvas 2D compositing — no manual pixel loops for
 * the recolor itself, no WebGL, no image generation.
 */

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const recolorCache = new Map<string, HTMLCanvasElement>();

/**
 * How much of the shadows.png / highlights.png mockup layers shows through,
 * as globalAlpha (0–1) on top of their own blend mode. The base photograph
 * already carries the real fold/light information (recolorBase preserves
 * its luminance untouched) — these layers are only meant to add a last,
 * subtle bit of depth, not to relight the garment. Turning either toward 0
 * makes the shirt flatter/more matte; turning them up reintroduces the
 * glossy/vertical-banding look these were dialed down to fix.
 */
const SHADOW_STRENGTH = 0.2;
const HIGHLIGHT_STRENGTH = 0.08;

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

function drawToImageData(img: HTMLImageElement, w: number, h: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Recolors base.png's own non-transparent region the way garment mockup
 * tools do it: convert the photo to grayscale — that grayscale *is* the
 * photographed light/shadow map, completely untouched, no contrast curve,
 * no renormalization — then multiply the flat target color through it
 * (result = targetColor × grayscale, per channel). A deep photographed fold
 * (low grayscale value) stays proportionally dark under any color; a lit
 * area (high grayscale value) stays proportionally light. That's also why
 * this is correct at both ends of the palette without special-casing them:
 * a near-black target multiplied through *any* grayscale value stays dark
 * (never a flat #000 — the grayscale variation still shows as subtle
 * relative differences), and a nearly-white target multiplied through
 * grayscale is ~= the grayscale itself, i.e. the photo's own natural grey
 * shadows survive instead of blowing out to a flat white silhouette.
 *
 * An earlier version used the canvas's native "color" blend mode (swap
 * hue/saturation, keep the backdrop's luminosity) — that's provably wrong
 * here: SetLum() discards the *source* color's own luminosity entirely, so
 * every target color rendered at the photo's own natural brightness — a
 * navy selection came out as pale washed-out blue, black came out nearly
 * white. Multiplying through grayscale is what actually darkens or lightens
 * the garment toward the chosen color while still tracking the photograph's
 * real shading.
 *
 * `shape` is an alpha-only stencil of the true garment silhouette (see
 * getGarmentShape) — used instead of mask.png to clip the result, because
 * mask.png's silhouette measured tens to ~150px (of 4500px) off from
 * base.png's at several scanlines, non-uniformly — a real export/alignment
 * mismatch, not anti-aliasing noise. Gating on it would punch an unrecolored
 * hole wherever it falls short of base's true silhouette (the white sleeve
 * patch seen in earlier testing). base.png's own — inherently self-aligned
 * — alpha doesn't have that problem. The clip is applied last because
 * "multiply" can otherwise paint the flat color at full opacity wherever
 * the backdrop had zero alpha (Porter-Duff falls back to plain source-over
 * there), which would leak color outside the garment.
 */
function recolorBase(baseImg: HTMLImageElement, shape: HTMLCanvasElement, colorHex: string): HTMLCanvasElement {
  const w = shape.width;
  const h = shape.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1)";
  ctx.drawImage(baseImg, 0, 0, w, h);
  ctx.filter = "none";

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(shape, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  return canvas;
}

/**
 * Recolors (and caches) base for a given color. `maskSrc` is still loaded
 * (so a missing mask file surfaces as a clear load error) but its content
 * isn't used to gate the recolor region — see the comment on recolorBase().
 */
export async function getRecoloredBase(baseSrc: string, maskSrc: string, colorHex: string): Promise<HTMLCanvasElement> {
  const key = `${baseSrc}|${colorHex.toLowerCase()}`;
  const cached = recolorCache.get(key);
  if (cached) return cached;

  const [baseImg, shape] = await Promise.all([loadImageCached(baseSrc), getGarmentShape(baseSrc), loadImageCached(maskSrc)]);
  const canvas = recolorBase(baseImg, shape, colorHex);
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
  /** 0–1 opacity for the shadow layer on top of its blend mode. Defaults to SHADOW_STRENGTH. */
  shadowStrength?: number;
  /** 0–1 opacity for the highlight layer on top of its blend mode. Defaults to HIGHLIGHT_STRENGTH. */
  highlightStrength?: number;
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
  const {
    recoloredBase,
    shadows,
    highlights,
    shadowBlendMode,
    highlightBlendMode,
    shadowStrength = SHADOW_STRENGTH,
    highlightStrength = HIGHLIGHT_STRENGTH,
    dpr,
  } = opts;
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
    ctx.globalAlpha = shadowStrength;
    ctx.drawImage(shadows, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }
  if (highlights) {
    ctx.globalCompositeOperation = highlightBlendMode;
    ctx.globalAlpha = highlightStrength;
    ctx.drawImage(highlights, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = "source-over";
}
