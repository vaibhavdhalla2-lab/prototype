import type { GarmentType } from "../data/catalog";

export type GarmentKind = GarmentType;

export interface GarmentAssetSet {
  /** Real photographed garment, transparent background. */
  base: string;
  /** Non-transparent pixels mark the recolorable fabric region. */
  mask: string;
  /** Fold/shadow detail on transparency, drawn above the recolored base. */
  shadows?: string;
  /** Highlight detail on transparency, drawn above shadows. */
  highlights?: string;
  /** Optional photographic reference — visual QA / fallback only, never a recoloring input. */
  reference?: string;
}

/**
 * A garment's photographic assets, per view. `back` is nullable: until a
 * real back-view photograph exists, resolveGarmentAssets() falls back to
 * `front` so the same recolored photo renders for both tabs. Drop in a
 * `back` set later and it takes over automatically — no component changes.
 */
export interface GarmentViewAssets {
  front: GarmentAssetSet;
  back?: GarmentAssetSet | null;
}

/**
 * Central place to register a garment's photographic asset set so
 * <GarmentPreview garment="tshirt" view="front" color="#..." /> can resolve
 * file paths without every call site repeating them.
 *
 * To add a new garment (e.g. a hoodie): drop its front-view PNGs (+ optional
 * reference image) under /public/garments/<kind>/front/, then add an entry
 * here. No changes to GarmentPreview or the compositor are needed — the
 * whole pipeline is asset-driven.
 */
export const GARMENT_ASSET_REGISTRY: Partial<Record<GarmentKind, GarmentViewAssets>> = {
  tshirt: {
    front: {
      base: "/garments/tshirt/base.png",
      mask: "/garments/tshirt/mask.png",
      shadows: "/garments/tshirt/shadow.png",
      highlights: "/garments/tshirt/highlight.png",
    },
    // No back-view photograph yet — resolveGarmentAssets() falls back to `front`.
    // Once one exists, drop it in and fill this the same shape as `front`:
    // back: {
    //   base: "/garments/tshirt/back/base.png",
    //   mask: "/garments/tshirt/back/mask.png",
    //   shadows: "/garments/tshirt/back/shadow.png",
    //   highlights: "/garments/tshirt/back/highlight.png",
    // },
    back: null,
  },

  // hoodie: {
  //   front: {
  //     base: "/garments/hoodie/base.png",
  //     mask: "/garments/hoodie/mask.png",
  //     shadows: "/garments/hoodie/shadows.png",
  //     highlights: "/garments/hoodie/highlights.png",
  //     reference: "/garments/hoodie/reference.webp",
  //   },
  //   back: null,
  // },

  // cap: {
  //   front: {
  //     base: "/garments/cap/base.png",
  //     mask: "/garments/cap/mask.png",
  //     shadows: "/garments/cap/shadows.png",
  //     highlights: "/garments/cap/highlights.png",
  //     reference: "/garments/cap/reference.webp",
  //   },
  //   back: null,
  // },
};

/**
 * Resolves the asset set for a garment/view pair, falling back to the front
 * view whenever a dedicated back-view set hasn't been provided yet.
 */
export function resolveGarmentAssets(garment: GarmentKind, view: "front" | "back"): GarmentAssetSet | undefined {
  const entry = GARMENT_ASSET_REGISTRY[garment];
  if (!entry) return undefined;
  return entry[view] ?? entry.front;
}

/** A print-safe rectangle expressed as fractions (0–1) of the *base photo's own* pixel dimensions. */
export interface PhotoPrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where user/marketplace artwork gets composited onto the photographed
 * garment (see drawGarmentToCanvas in garmentCompositor.ts) — the chest
 * print zone, measured directly off base.png's alpha silhouette (clear of
 * the collar above and the waist taper below). Independent of `mask.png`
 * for the same reason recolorBase() is: base.png's own alpha is the
 * authoritative silhouette.
 */
export const PHOTO_PRINT_AREAS: Partial<Record<GarmentKind, PhotoPrintArea>> = {
  tshirt: { x: 0.37, y: 0.3, width: 0.26, height: 0.26 },
};

export function resolvePhotoPrintArea(garment: GarmentKind): PhotoPrintArea {
  return PHOTO_PRINT_AREAS[garment] ?? { x: 0.35, y: 0.3, width: 0.3, height: 0.3 };
}
