import type { GarmentType } from "./catalog";

/**
 * The full FORMÉ product universe — a superset of the apparel-only
 * GarmentType from catalog.ts. Apparel ids stay backed by the existing
 * photographic/SVG garment system (GarmentStage, PRINT_AREAS in Garment.tsx);
 * the rest are rendered by the new faces in components/products/ProductFaces.tsx.
 */
export type ProductId = GarmentType | "mug" | "poster" | "bottle" | "deskpad" | "phonecase";

export type ProductCategory = "apparel" | "drinkware" | "wall-art" | "desk" | "tech";

export interface VariantOption {
  id: string;
  label: string;
  /** Short one-line descriptor shown under the option label. */
  description?: string;
  priceImpact?: number;
  /** Swatch/preview hex for options that represent a physical color (e.g. bottle base, case edge). */
  hex?: string;
}

export interface VariantGroup {
  key: string;
  label: string;
  options: VariantOption[];
}

export interface ProductDef {
  id: ProductId;
  label: string;
  category: ProductCategory;
  basePrice: number;
  blurb: string;
  /** Short line describing what makes this product's customization distinct. */
  customizationNote: string;
  /** True = a real, selectable product in this V1. Apparel hoodie/cap still gate on catalog.ts's own `available` for the legacy studio flow. */
  available: boolean;
  /** Generic variant dimensions beyond color — apparel keeps using material/fit from catalog.ts in addition to (or instead of) these. */
  variantGroups: VariantGroup[];
  /** Named placement presets surfaced in the studio (e.g. "Center chest", "Wraparound"). */
  placements: { id: string; label: string }[];
}

export const PRODUCTS: ProductDef[] = [
  {
    id: "tshirt",
    label: "T-Shirt",
    category: "apparel",
    basePrice: 1299,
    blurb: "The everyday canvas. Endlessly wearable.",
    customizationNote: "Front, back, or a small chest mark — your call.",
    available: true,
    variantGroups: [],
    placements: [
      { id: "center-chest", label: "Center chest" },
      { id: "left-chest", label: "Left chest" },
      { id: "full-back", label: "Full back" },
      { id: "upper-back", label: "Upper back" },
    ],
  },
  {
    id: "mug",
    label: "Mug",
    category: "drinkware",
    basePrice: 649,
    blurb: "Your morning ritual, personalized.",
    customizationNote: "Wraps around, or stays put on one clean panel.",
    available: true,
    variantGroups: [
      {
        key: "material",
        label: "Material",
        options: [
          { id: "ceramic", label: "Ceramic", description: "Classic weight, smooth print surface.", priceImpact: 0 },
          { id: "enamel", label: "Enamel", description: "Campfire-ready, lightweight metal.", priceImpact: 80 },
          { id: "steel", label: "Stainless Steel", description: "Double-wall, keeps drinks hot longer.", priceImpact: 220 },
        ],
      },
      {
        key: "finish",
        label: "Finish",
        options: [
          { id: "glossy", label: "Glossy", description: "Bright, saturated color.", priceImpact: 0 },
          { id: "matte", label: "Matte", description: "Soft-touch, muted tone.", priceImpact: 60 },
        ],
      },
      {
        key: "size",
        label: "Size",
        options: [
          { id: "sm", label: "Small · 240ml", priceImpact: -50 },
          { id: "md", label: "Medium · 325ml", priceImpact: 0 },
          { id: "lg", label: "Large · 440ml", priceImpact: 90 },
        ],
      },
    ],
    placements: [
      { id: "front-panel", label: "Front panel" },
      { id: "wraparound", label: "Wraparound" },
      { id: "two-side", label: "Two-side layout" },
    ],
  },
  {
    id: "poster",
    label: "Poster",
    category: "wall-art",
    basePrice: 799,
    blurb: "Editorial-grade prints for your wall.",
    customizationNote: "Full-bleed composition, framed or not.",
    available: true,
    variantGroups: [
      {
        key: "orientation",
        label: "Orientation",
        options: [
          { id: "portrait", label: "Portrait", priceImpact: 0 },
          { id: "landscape", label: "Landscape", priceImpact: 0 },
          { id: "square", label: "Square", priceImpact: 0 },
        ],
      },
      {
        key: "size",
        label: "Size",
        options: [
          { id: "a4", label: "A4", description: "21 × 29.7 cm", priceImpact: 0 },
          { id: "a3", label: "A3", description: "29.7 × 42 cm", priceImpact: 250 },
          { id: "a2", label: "A2", description: "42 × 59.4 cm", priceImpact: 550 },
        ],
      },
      {
        key: "paper",
        label: "Paper",
        options: [
          { id: "matte", label: "Matte", description: "Soft, non-reflective.", priceImpact: 0 },
          { id: "glossy", label: "Glossy", description: "Punchy contrast and color.", priceImpact: 50 },
          { id: "fine-art", label: "Textured Fine Art", description: "Gallery-grade cotton stock.", priceImpact: 350 },
        ],
      },
      {
        key: "frame",
        label: "Frame",
        options: [
          { id: "none", label: "Unframed", priceImpact: 0 },
          { id: "black", label: "Black frame", priceImpact: 600, hex: "#17140f" },
          { id: "white", label: "White frame", priceImpact: 600, hex: "#f1ead9" },
          { id: "walnut", label: "Walnut frame", priceImpact: 800, hex: "#5a3a26" },
        ],
      },
    ],
    placements: [{ id: "full-surface", label: "Full surface" }],
  },
  {
    id: "bottle",
    label: "Bottle",
    category: "drinkware",
    basePrice: 899,
    blurb: "Keeps drinks cold, carries a statement.",
    customizationNote: "A tall badge, or wrap the whole body.",
    available: true,
    variantGroups: [
      {
        key: "material",
        label: "Material",
        options: [
          { id: "steel", label: "Stainless Steel", priceImpact: 0 },
          { id: "aluminum", label: "Aluminum", priceImpact: -60 },
          { id: "insulated", label: "Insulated Double-Wall", description: "Keeps cold 24h+.", priceImpact: 250 },
        ],
      },
      {
        key: "capacity",
        label: "Capacity",
        options: [
          { id: "sm", label: "500ml", priceImpact: -80 },
          { id: "md", label: "750ml", priceImpact: 0 },
          { id: "lg", label: "1L", priceImpact: 120 },
        ],
      },
      {
        key: "lid",
        label: "Cap style",
        options: [
          { id: "screw", label: "Screw cap", priceImpact: 0 },
          { id: "flip", label: "Flip straw", priceImpact: 90 },
          { id: "carabiner", label: "Carabiner lid", priceImpact: 70 },
        ],
      },
    ],
    placements: [
      { id: "front-badge", label: "Front badge" },
      { id: "wraparound", label: "Wraparound" },
      { id: "monogram", label: "Emblem / monogram" },
    ],
  },
  {
    id: "deskpad",
    label: "Desk Pad",
    category: "desk",
    basePrice: 999,
    blurb: "A panoramic canvas for your desk setup.",
    customizationNote: "Wide-format — designed to fill your whole workspace.",
    available: true,
    variantGroups: [
      {
        key: "size",
        label: "Size",
        options: [
          { id: "sm", label: "Small · 60×30cm", priceImpact: -150 },
          { id: "md", label: "Medium · 80×40cm", priceImpact: 0 },
          { id: "lg", label: "Large · 90×40cm", priceImpact: 150 },
          { id: "xl", label: "XL · 120×60cm", priceImpact: 400 },
        ],
      },
      {
        key: "surface",
        label: "Surface",
        options: [
          { id: "fabric", label: "Fabric top", description: "Soft, smooth glide.", priceImpact: 0 },
          { id: "smooth", label: "Premium smooth", description: "Low-friction, precise.", priceImpact: 120 },
          { id: "gaming", label: "Gaming surface", description: "Fast glide, stitched control.", priceImpact: 180 },
        ],
      },
      {
        key: "edge",
        label: "Edge",
        options: [
          { id: "stitched", label: "Stitched edge", priceImpact: 40 },
          { id: "clean", label: "Clean cut edge", priceImpact: 0 },
        ],
      },
      {
        key: "base",
        label: "Base",
        options: [
          { id: "standard", label: "Standard", priceImpact: 0 },
          { id: "cushioned", label: "Cushioned", priceImpact: 90 },
          { id: "antislip", label: "Anti-slip rubber", priceImpact: 60 },
        ],
      },
    ],
    placements: [{ id: "full-bleed", label: "Full-bleed panorama" }],
  },
  {
    id: "phonecase",
    label: "Phone Case",
    category: "tech",
    basePrice: 699,
    blurb: "Pocket-sized, always with you.",
    customizationNote: "Camera-safe layout that adapts to your phone model.",
    available: true,
    variantGroups: [
      {
        key: "model",
        label: "Phone model",
        options: [
          { id: "iphone-15", label: "iPhone 15 / 15 Pro", priceImpact: 0 },
          { id: "iphone-14", label: "iPhone 14", priceImpact: 0 },
          { id: "pixel-8", label: "Pixel 8", priceImpact: 0 },
          { id: "galaxy-s24", label: "Galaxy S24", priceImpact: 0 },
        ],
      },
      {
        key: "type",
        label: "Case type",
        options: [
          { id: "slim", label: "Slim", description: "Minimal bulk.", priceImpact: 0 },
          { id: "tough", label: "Tough", description: "Drop protection.", priceImpact: 150 },
          { id: "clear", label: "Clear", description: "Shows the phone's own color.", priceImpact: 50 },
          { id: "magsafe", label: "MagSafe-compatible", priceImpact: 100 },
        ],
      },
      {
        key: "finish",
        label: "Finish",
        options: [
          { id: "matte", label: "Matte", priceImpact: 0 },
          { id: "glossy", label: "Glossy", priceImpact: 0 },
        ],
      },
    ],
    placements: [
      { id: "full-back", label: "Full back" },
      { id: "monogram", label: "Initials / monogram" },
      { id: "collage", label: "Sticker collage" },
    ],
  },
];

export function productById(id: ProductId): ProductDef {
  const found = PRODUCTS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown product id "${id}"`);
  return found;
}

export function variantGroupsFor(id: ProductId): VariantGroup[] {
  return productById(id).variantGroups;
}

export function defaultVariantsFor(id: ProductId): Record<string, string> {
  const groups = variantGroupsFor(id);
  return Object.fromEntries(groups.map((g) => [g.key, g.options[0].id]));
}

export function variantPriceImpact(id: ProductId, variants: Record<string, string>): number {
  const groups = variantGroupsFor(id);
  return groups.reduce((sum, g) => {
    const chosen = g.options.find((o) => o.id === variants[g.key]);
    return sum + (chosen?.priceImpact ?? 0);
  }, 0);
}

/** Products that ship with a real photographic/SVG garment renderer today. */
export const APPAREL_IDS: ProductId[] = ["tshirt", "hoodie", "cap"];
export function isApparel(id: ProductId): id is GarmentType {
  return (APPAREL_IDS as string[]).includes(id);
}
