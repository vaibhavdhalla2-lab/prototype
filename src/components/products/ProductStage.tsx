import type { ReactNode } from "react";
import { GarmentStage, PRINT_AREAS, type GarmentStageProps } from "../Garment";
import { isApparel, type ProductId } from "../../data/products";
import { MugFace, PosterFace, BottleFace, DeskPadFace, PhoneCaseFace, PRODUCT_PRINT_AREAS, type ProductSide, type PrintAreaRect } from "./ProductFaces";

export interface ProductStageProps {
  product: ProductId;
  colorHex: string;
  /** "front"/"back" — for non-apparel products this is repurposed per product (wraparound, angled) rather than a literal reverse side. */
  view: ProductSide | "3d";
  variants: Record<string, string>;
  frontOverlay?: ReactNode;
  backOverlay?: ReactNode;
  fit?: GarmentStageProps["fit"];
  accentTrim?: boolean;
  pocketVisible?: boolean;
  className?: string;
}

/** Single entry point the studio renders through — apparel keeps its existing photographic/SVG system untouched; everything else goes through the new flat-illustration faces. */
export default function ProductStage({ product, colorHex, view, variants, frontOverlay, backOverlay, fit, accentTrim, pocketVisible, className }: ProductStageProps) {
  if (isApparel(product)) {
    return (
      <GarmentStage
        garment={product}
        colorHex={colorHex}
        view={view === "3d" ? "3d" : view}
        fit={fit}
        accentTrim={accentTrim}
        pocketVisible={pocketVisible}
        frontOverlay={frontOverlay}
        backOverlay={backOverlay}
        className={className}
      />
    );
  }

  const side: ProductSide = view === "back" ? "back" : "front";
  const overlay = side === "back" ? backOverlay : frontOverlay;
  const props = { colorHex, side, overlay, variants };

  const Face =
    product === "mug" ? MugFace : product === "poster" ? PosterFace : product === "bottle" ? BottleFace : product === "deskpad" ? DeskPadFace : PhoneCaseFace;

  return (
    <div className={`relative ${className ?? ""}`}>
      <Face {...props} />
    </div>
  );
}

/** Print area for the current product+side, drawing from the apparel PRINT_AREAS or the new product faces' table. */
export function printAreaFor(product: ProductId, side: ProductSide): PrintAreaRect {
  if (isApparel(product)) return PRINT_AREAS[product][side];
  return PRODUCT_PRINT_AREAS[product]![side];
}

/** Whether this product exposes a second, meaningful view (back/wraparound/angled) beyond its front. Posters and desk pads are single-view — the whole point is one full-bleed composition. */
export function hasSecondaryView(product: ProductId): boolean {
  return product !== "poster" && product !== "deskpad";
}

/** Label for the secondary view tab, contextual per product. */
export function secondaryViewLabel(product: ProductId): string {
  if (isApparel(product)) return "Back";
  if (product === "mug") return "Wraparound";
  return "Angled";
}
