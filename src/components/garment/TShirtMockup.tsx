import GarmentPreview, { type GarmentPreviewProps } from "./GarmentPreview";

export interface TShirtMockupProps extends Omit<GarmentPreviewProps, "garment" | "view"> {
  view?: "front" | "back";
}

/**
 * <TShirtMockup color="#171717" design="/garments/tshirt/samurai.png" /> —
 * a thin, named preset over GarmentPreview (garment="tshirt" pinned) so
 * marketplace/selector call sites don't repeat that wiring. GarmentPreview
 * itself is already garment-agnostic (see garmentAssets.ts's registry), so
 * a HoodieMockup/CapMockup would be the same one-line wrapper once those
 * garments get their own photographic asset sets.
 */
export default function TShirtMockup(props: TShirtMockupProps) {
  return <GarmentPreview garment="tshirt" {...props} />;
}
