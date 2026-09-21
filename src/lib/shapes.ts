/** Curated shape library for the Graphics tool — kept small on purpose (per spec: "do not overpopulate V1"). */
export type ShapeId = "circle" | "square" | "rectangle" | "line" | "star" | "arrow" | "blob";

export const SHAPES: { id: ShapeId; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "rectangle", label: "Rectangle" },
  { id: "line", label: "Line" },
  { id: "star", label: "Star" },
  { id: "arrow", label: "Arrow" },
  { id: "blob", label: "Blob" },
];

/** Returns fill+stroke path data (or a line's stroke-only path), centered on (0,0), roughly -20..20 across. */
export function shapePath(id: ShapeId): { d: string; kind: "fill" | "stroke" } {
  switch (id) {
    case "circle":
      return { d: "M -18 0 A 18 18 0 1 0 18 0 A 18 18 0 1 0 -18 0 Z", kind: "fill" };
    case "square":
      return { d: "M -16 -16 H 16 V 16 H -16 Z", kind: "fill" };
    case "rectangle":
      return { d: "M -20 -11 H 20 V 11 H -20 Z", kind: "fill" };
    case "line":
      return { d: "M -20 0 H 20", kind: "stroke" };
    case "star": {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 19 : 8;
        pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      return { d: pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + " Z", kind: "fill" };
    }
    case "arrow":
      return { d: "M -18 6 H 10 M 10 6 L -1 -6 M 10 6 L -1 18", kind: "stroke" };
    case "blob":
      return { d: "M -17 -4 C -19 -14 -6 -20 5 -17 C 18 -14 20 -2 15 8 C 10 19 -8 20 -15 10 C -20 3 -16 4 -17 -4 Z", kind: "fill" };
  }
}
