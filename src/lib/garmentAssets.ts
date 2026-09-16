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
 * Central place to register a garment's photographic asset set so
 * <GarmentPreview garment="tshirt" color="#..." /> can resolve file paths
 * without every call site repeating them.
 *
 * To add a new garment (e.g. a hoodie): drop its 4 PNGs (+ optional
 * reference image) under /public/garments/<kind>/ with the same filenames
 * as the T-shirt's, then add an entry here. No changes to GarmentPreview or
 * the compositor are needed — the whole pipeline is asset-driven.
 */
export const GARMENT_ASSET_REGISTRY: Partial<Record<GarmentKind, GarmentAssetSet>> = {
  tshirt: {
    base: "/garments/tshirt/base.png",
    mask: "/garments/tshirt/mask.png",
    shadows: "/garments/tshirt/shadows.png",
    highlights: "/garments/tshirt/highlights.png",
    reference: "/garments/tshirt/reference.webp",
  },

  // hoodie: {
  //   base: "/garments/hoodie/base.png",
  //   mask: "/garments/hoodie/mask.png",
  //   shadows: "/garments/hoodie/shadows.png",
  //   highlights: "/garments/hoodie/highlights.png",
  //   reference: "/garments/hoodie/reference.webp",
  // },

  // cap: {
  //   base: "/garments/cap/base.png",
  //   mask: "/garments/cap/mask.png",
  //   shadows: "/garments/cap/shadows.png",
  //   highlights: "/garments/cap/highlights.png",
  //   reference: "/garments/cap/reference.webp",
  // },
};
