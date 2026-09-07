export type MotifId = "bolt" | "star" | "wave" | "ring" | "arrow";

export const MOTIFS: { id: MotifId; label: string }[] = [
  { id: "bolt", label: "Bolt" },
  { id: "star", label: "Star" },
  { id: "wave", label: "Wave" },
  { id: "ring", label: "Ring" },
  { id: "arrow", label: "Arrow" },
];

/** Local point sets in a roughly -20..20 coordinate space, centered on origin. */
function localPoints(id: MotifId): [number, number][] {
  switch (id) {
    case "bolt":
      return [
        [3, -20],
        [-7, 3],
        [1, 3],
        [-4, 20],
        [9, -2],
        [0, -2],
        [3, -20],
      ];
    case "star": {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 19 : 8;
        pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      return pts;
    }
    case "wave": {
      const pts: [number, number][] = [];
      for (let x = -20; x <= 20; x += 4) {
        pts.push([x, Math.sin((x / 20) * Math.PI * 1.5) * 10]);
      }
      return pts;
    }
    case "ring": {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 24; i++) {
        const angle = (Math.PI * 2 * i) / 24;
        pts.push([Math.cos(angle) * 16, Math.sin(angle) * 16]);
      }
      return pts;
    }
    case "arrow":
      return [
        [-18, 6],
        [18, 6],
        [18, 6],
        [7, -6],
        [18, 6],
        [7, 18],
      ];
  }
}

export function motifPathD(id: MotifId, cx: number, cy: number, scale = 2.2): string {
  const pts = localPoints(id);
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(cx + x * scale).toFixed(1)},${(cy + y * scale).toFixed(1)}`).join(" ");
}

/** A small standalone path (0,0 centered, ~40x40) for rendering an icon preview. */
export function motifIconD(id: MotifId): string {
  return motifPathD(id, 20, 20, 0.85);
}
