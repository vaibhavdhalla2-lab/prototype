import type { ColorId, FitId, GarmentType, MaterialId } from "../data/catalog";
import { COLORS, materialsFor, fitsFor } from "../data/catalog";
import { isApparel, variantGroupsFor, type ProductId } from "../data/products";

export interface MuseConcept {
  garment: GarmentType;
  color: ColorId;
  material: MaterialId;
  fit: FitId;
  graphicNote: string;
  reason: string;
}

interface Keywords {
  test: RegExp;
  garment?: GarmentType;
  color?: ColorId;
  material?: MaterialId;
  fit?: FitId;
}

const RULES: Keywords[] = [
  { test: /hoodie|hood\b/i, garment: "hoodie" },
  { test: /cap|hat/i, garment: "cap" },
  { test: /t-?shirt|tee\b/i, garment: "tshirt" },
  { test: /black|noir|dark/i, color: "black" },
  { test: /white|ivory|cream/i, color: "offwhite" },
  { test: /stone|sand|beige|taupe/i, color: "stone" },
  { test: /navy|blue/i, color: "navy" },
  { test: /forest|green|olive/i, color: "forest" },
  { test: /burgundy|maroon|wine|red/i, color: "burgundy" },
  { test: /gr[ea]y/i, color: "grey" },
  { test: /oversized|baggy|streetwear/i, fit: "oversized" },
  { test: /cropped|crop\b/i, fit: "cropped" },
  { test: /relaxed|easy|casual/i, fit: "relaxed" },
  { test: /regular|classic|true.to.size/i, fit: "regular" },
  { test: /premium|structured|heavyweight|substantial/i, material: "heavyweight-cotton" },
  { test: /breathable|summer|light|airy/i, material: "lightweight-cotton" },
  { test: /winter|warm|cold|cozy/i, material: "heavyweight-cotton" },
  { test: /soft|gentle|organic|eco/i, material: "organic-jersey" },
];

export function interpretPrompt(text: string): MuseConcept {
  const t = text.trim();
  let garment: GarmentType = "hoodie";
  let color: ColorId = "black";
  let material: MaterialId = "heavyweight-cotton";
  let fit: FitId = "oversized";

  let matchedGarment = false;
  let matchedColor = false;
  let matchedMaterial = false;
  let matchedFit = false;

  for (const rule of RULES) {
    if (rule.test.test(t)) {
      if (rule.garment && !matchedGarment) {
        garment = rule.garment;
        matchedGarment = true;
      }
      if (rule.color && !matchedColor) {
        color = rule.color;
        matchedColor = true;
      }
      if (rule.material && !matchedMaterial) {
        material = rule.material;
        matchedMaterial = true;
      }
      if (rule.fit && !matchedFit) {
        fit = rule.fit;
        matchedFit = true;
      }
    }
  }

  if (garment === "cap" && material !== "tri-blend") material = "tri-blend";
  if (garment === "tshirt" && material === "french-terry") material = "heavyweight-cotton";
  if (garment !== "tshirt" && fit === "cropped") fit = "relaxed";

  const graphicNote = /minimal|clean|simple/i.test(t)
    ? "Minimal graphic, front placement"
    : /graphic|print|bold|statement/i.test(t)
      ? "Bold front graphic"
      : "Subtle front detail";

  return {
    garment,
    color,
    material,
    fit,
    graphicNote,
    reason: `Here's how I'd interpret your idea — a ${fit} ${garment === "tshirt" ? "t-shirt" : garment} with a considered, wearable silhouette.`,
  };
}

interface MuseGoalResponse {
  material: MaterialId;
  reason: string;
}

export function museMaterialRecommendation(goal: string, garment: GarmentType, fit: FitId): MuseGoalResponse {
  const g = goal.toLowerCase();
  if (/premium|structure|hold.*shape|substantial/.test(g)) {
    return {
      material: garment === "cap" ? "tri-blend" : "heavyweight-cotton",
      reason: `I'd recommend ${garment === "cap" ? "Cotton Twill" : "Heavyweight Cotton"}. ${
        fit === "oversized" ? "You've chosen an oversized silhouette, and the extra structure will help the garment hold its shape." : "It has a denser hand-feel that reads as more premium."
      }`,
    };
  }
  if (/breath|hot|summer|light/.test(g)) {
    return {
      material: garment === "tshirt" ? "lightweight-cotton" : "organic-jersey",
      reason: "I'd recommend Lightweight Cotton. It's airy and moves well — ideal if you want something you can wear all day without it feeling heavy.",
    };
  }
  if (/winter|cold|warm|cozy/.test(g)) {
    return {
      material: garment === "hoodie" ? "french-terry" : "heavyweight-cotton",
      reason: "I'd recommend French Terry. The looped interior traps warmth without adding bulk, so it stays comfortable in colder weather.",
    };
  }
  if (/streetwear|oversized|baggy/.test(g)) {
    return {
      material: "heavyweight-cotton",
      reason: "I'd recommend Heavyweight Cotton. Oversized cuts rely on fabric weight to hang correctly — this keeps the silhouette intentional rather than sloppy.",
    };
  }
  return {
    material: garment === "cap" ? "tri-blend" : "lightweight-cotton",
    reason: "I'd recommend starting light and versatile — you can always size up in structure once you've settled on a silhouette.",
  };
}

export const MUSE_PROMPT_CHIPS = [
  "I want something premium.",
  "I want it breathable.",
  "I want something for winter.",
  "I want an oversized streetwear look.",
];

/** Style biases the MUSE panel's quick-action buttons nudge generation toward. */
export type MuseStyleBias = "neutral" | "minimal" | "bold";

export interface MuseVariant {
  id: string;
  label: string;
  reason: string;
  colorId: ColorId;
  /** Apparel-only. */
  material?: MaterialId;
  fit?: FitId;
  /** Non-apparel — a full variants record for the current product. */
  variants?: Record<string, string>;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

const MINIMAL_COLORS: ColorId[] = ["offwhite", "stone", "black"];
const BOLD_COLORS: ColorId[] = ["black", "burgundy", "navy", "forest"];

/**
 * Generates 4 deterministic design "concepts" for whatever product is
 * currently active in the studio — this is what powers MUSE's primary
 * "Generate 4 ideas" moment. Apparel gets color+material+fit combinations;
 * every other product gets color plus a full variant-group combination
 * (mug material/finish/size, poster paper/frame, etc.) so MUSE reasons about
 * the actual dimensions that product exposes, not a generic placeholder.
 */
export function generateMuseVariants(prompt: string, product: ProductId, bias: MuseStyleBias = "neutral", nonce = 0): MuseVariant[] {
  const base = hashString(prompt || "muse") + nonce * 97;
  const colorPool = bias === "minimal" ? MINIMAL_COLORS : bias === "bold" ? BOLD_COLORS : COLORS.map((c) => c.id);

  return Array.from({ length: 4 }, (_, i) => {
    const seed = base + i * 131;
    const colorId = pick(colorPool, seed + i * 7);

    if (isApparel(product)) {
      const materials = materialsFor(product);
      const fits = fitsFor(product);
      const material = bias === "minimal" ? materials[0]?.id : bias === "bold" ? materials[materials.length - 1]?.id : pick(materials, seed).id;
      const fit = pick(fits, seed + 11).id;
      return {
        id: `${seed}`,
        label: `Concept ${i + 1}`,
        reason:
          bias === "minimal"
            ? "Clean, quiet and versatile — lets the silhouette do the talking."
            : bias === "bold"
              ? "Higher contrast and a heavier hand-feel — reads confident from across the room."
              : "A balanced read on your brief.",
        colorId,
        material: material as MaterialId,
        fit: fit as FitId,
      };
    }

    const groups = variantGroupsFor(product);
    const variants: Record<string, string> = {};
    for (const g of groups) {
      const idx = bias === "minimal" ? 0 : bias === "bold" ? g.options.length - 1 : Math.abs(seed + g.key.length) % g.options.length;
      variants[g.key] = g.options[idx].id;
    }
    return {
      id: `${seed}`,
      label: `Concept ${i + 1}`,
      reason:
        bias === "minimal"
          ? "The simplest, most versatile combination for this product."
          : bias === "bold"
            ? "The most premium, statement-making combination available."
            : "A balanced read on your brief.",
      colorId,
      variants,
    };
  });
}

interface DesignSnapshot {
  garment: GarmentType;
  material: MaterialId;
  fit: FitId;
  finish: "print" | "embroidery";
}

/** Small, non-interrupting contextual tips based on the current combination of choices. */
export function contextualTip(d: DesignSnapshot): string | null {
  if (d.fit === "oversized" && d.material === "heavyweight-cotton") {
    return "Nice combination. The heavier fabric will help this silhouette hold its shape.";
  }
  if (d.fit === "oversized" && (d.material === "lightweight-cotton" || d.material === "organic-jersey")) {
    return "This will create a softer, more fluid silhouette.";
  }
  if (d.fit === "cropped" && d.material === "heavyweight-cotton") {
    return "Heavyweight cotton on a cropped cut reads structured rather than casual — a deliberate look.";
  }
  if (d.garment === "hoodie" && d.material === "french-terry" && d.fit === "relaxed") {
    return "French terry and a relaxed fit is the easiest everyday hoodie combination there is.";
  }
  if (d.finish === "embroidery" && d.fit === "oversized") {
    return "Keep embroidery simple on an oversized fit — fine detail can get lost across the extra fabric.";
  }
  return null;
}

export interface ManufacturabilityIssue {
  message: string;
  fixLabel: string;
  fixMaterial: MaterialId;
}

/** Illustrative manufacturing constraints — FORMÉ's current production universe is defined, not infinite. */
export function checkManufacturability(d: DesignSnapshot): ManufacturabilityIssue | null {
  if (d.finish === "embroidery" && (d.material === "lightweight-cotton" || d.material === "organic-jersey")) {
    const fixMaterial: MaterialId = d.garment === "hoodie" ? "french-terry" : "heavyweight-cotton";
    return {
      message: "Fine embroidery can pucker a lighter fabric like this — it isn't currently supported in production.",
      fixLabel: d.garment === "hoodie" ? "Switch to French Terry" : "Switch to Heavyweight Cotton",
      fixMaterial,
    };
  }
  return null;
}
