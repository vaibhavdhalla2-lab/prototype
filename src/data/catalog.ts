export type GarmentType = "tshirt" | "hoodie" | "cap";
export type ViewMode = "front" | "back" | "3d";
export type ColorId =
  | "black"
  | "offwhite"
  | "stone"
  | "navy"
  | "forest"
  | "burgundy"
  | "grey";
export type MaterialId =
  | "heavyweight-cotton"
  | "lightweight-cotton"
  | "french-terry"
  | "organic-jersey"
  | "tri-blend";
export type FitId = "oversized" | "relaxed" | "regular" | "cropped";

export interface GarmentDef {
  id: GarmentType;
  label: string;
  basePrice: number;
  blurb: string;
}

export const GARMENTS: GarmentDef[] = [
  { id: "tshirt", label: "T-Shirt", basePrice: 1299, blurb: "The everyday canvas. Endlessly wearable." },
  { id: "hoodie", label: "Hoodie", basePrice: 2199, blurb: "Structured comfort. Built to hold a statement." },
  { id: "cap", label: "Cap", basePrice: 899, blurb: "A small canvas with an outsized presence." },
];

export interface ColorDef {
  id: ColorId;
  label: string;
  hex: string;
  description: string;
}

export const COLORS: ColorDef[] = [
  { id: "black", label: "Black", hex: "#17140f", description: "Timeless, bold and visually slimming." },
  { id: "offwhite", label: "Off White", hex: "#f1ead9", description: "Clean, versatile and easy to pair with almost anything." },
  { id: "stone", label: "Stone", hex: "#b8ab93", description: "Warm and understated — a quiet neutral that works with everything." },
  { id: "navy", label: "Navy", hex: "#232d3f", description: "Grounded and sharp, with more depth than black." },
  { id: "forest", label: "Forest", hex: "#2f3d2e", description: "Deep and understated with a more distinctive character." },
  { id: "burgundy", label: "Burgundy", hex: "#5a2331", description: "Rich and confident — a statement without being loud." },
  { id: "grey", label: "Grey", hex: "#7c766c", description: "Soft and low-key. The easiest colour to build around." },
];

export interface MaterialDef {
  id: MaterialId;
  label: string;
  tagline: string;
  feel: string;
  bestFor: string;
  breathability: number; // 1-5
  durability: number; // 1-5
  priceImpact: number; // added to base price
  priceTier: string;
  appliesTo: GarmentType[];
}

export const MATERIALS: MaterialDef[] = [
  {
    id: "heavyweight-cotton",
    label: "Heavyweight Cotton",
    tagline: "Structured, substantial and premium.",
    feel: "Dense, soft, holds a crease",
    bestFor: "Oversized silhouettes",
    breathability: 3,
    durability: 5,
    priceImpact: 400,
    priceTier: "₹₹",
    appliesTo: ["tshirt", "hoodie"],
  },
  {
    id: "lightweight-cotton",
    label: "Lightweight Cotton",
    tagline: "Breathable and easy for everyday wear.",
    feel: "Soft, airy, relaxed drape",
    bestFor: "Summer / relaxed fits",
    breathability: 5,
    durability: 3,
    priceImpact: 0,
    priceTier: "₹",
    appliesTo: ["tshirt"],
  },
  {
    id: "french-terry",
    label: "French Terry",
    tagline: "Looped-back comfort with real structure.",
    feel: "Soft interior, smooth face",
    bestFor: "Everyday hoodies",
    breathability: 3,
    durability: 4,
    priceImpact: 300,
    priceTier: "₹₹",
    appliesTo: ["hoodie"],
  },
  {
    id: "organic-jersey",
    label: "Organic Jersey",
    tagline: "Lightweight, low-impact and gentle on skin.",
    feel: "Fine knit, soft hand-feel",
    bestFor: "Fitted, minimal designs",
    breathability: 4,
    durability: 3,
    priceImpact: 250,
    priceTier: "₹₹",
    appliesTo: ["tshirt"],
  },
  {
    id: "tri-blend",
    label: "Cotton Twill",
    tagline: "Firm and durable — built for structure.",
    feel: "Crisp, holds a curved brim",
    bestFor: "Structured caps",
    breathability: 3,
    durability: 5,
    priceImpact: 150,
    priceTier: "₹",
    appliesTo: ["cap"],
  },
];

export interface FitDef {
  id: FitId;
  label: string;
  description: string;
  appliesTo: GarmentType[];
}

export const FITS: FitDef[] = [
  { id: "oversized", label: "Oversized", description: "More volume through the body and sleeves. Best for a contemporary streetwear silhouette.", appliesTo: ["tshirt", "hoodie"] },
  { id: "relaxed", label: "Relaxed", description: "Easy through the shoulders with a straight drop. Comfortable without losing shape.", appliesTo: ["tshirt", "hoodie"] },
  { id: "regular", label: "Regular", description: "A classic, true-to-size cut. Familiar and versatile.", appliesTo: ["tshirt", "hoodie", "cap"] },
  { id: "cropped", label: "Cropped", description: "Shortened body length for a more directional silhouette.", appliesTo: ["tshirt"] },
];

export function materialsFor(g: GarmentType) {
  return MATERIALS.filter((m) => m.appliesTo.includes(g));
}
export function fitsFor(g: GarmentType) {
  return FITS.filter((f) => f.appliesTo.includes(g));
}
export function garmentById(id: GarmentType) {
  return GARMENTS.find((g) => g.id === id)!;
}
export function colorById(id: ColorId) {
  return COLORS.find((c) => c.id === id)!;
}
export function materialById(id: MaterialId) {
  return MATERIALS.find((m) => m.id === id)!;
}
export function fitById(id: FitId) {
  return FITS.find((f) => f.id === id)!;
}

export const DELIVERY_ESTIMATE = "4–7 business days";

export function estimatePrice(opts: {
  garment: GarmentType;
  material: MaterialId;
  hasGraphic: boolean;
  hasText: boolean;
}) {
  const base = garmentById(opts.garment).basePrice;
  const mat = materialById(opts.material).priceImpact;
  const graphic = opts.hasGraphic ? 250 : 0;
  const text = opts.hasText ? 100 : 0;
  return base + mat + graphic + text;
}

export const COMING_SOON = ["Jerseys", "Socks", "Women's Wear", "Accessories", "Phone Cases", "Stickers"];
