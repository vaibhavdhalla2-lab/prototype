export interface GarmentColorOption {
  name: string;
  value: string;
}

/** Tuned for the soft-light recoloring pipeline in garmentCompositor.ts — see GarmentPreview. */
export const garmentColors: GarmentColorOption[] = [
  { name: "Cream", value: "#E8DFCD" },
  { name: "White", value: "#F4F3EE" },
  { name: "Black", value: "#171717" },
  { name: "Washed Grey", value: "#77736C" },
  { name: "Navy", value: "#182130" },
  { name: "Olive", value: "#62634D" },
  { name: "Burgundy", value: "#633944" },
];
