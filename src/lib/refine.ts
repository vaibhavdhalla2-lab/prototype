import type { DrawStroke } from "./store";

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** Reads every coordinate directly out of the stroke path strings — no DOM measurement required. */
export function strokesBBox(strokes: DrawStroke[]): BBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of strokes) {
    const nums = s.d.match(/-?\d+\.?\d*/g);
    if (!nums) continue;
    const pad = s.width / 2;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = parseFloat(nums[i]);
      const y = parseFloat(nums[i + 1]);
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      minX = Math.min(minX, x - pad);
      maxX = Math.max(maxX, x + pad);
      minY = Math.min(minY, y - pad);
      maxY = Math.max(maxY, y + pad);
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Computes a translate+scale transform that centers and balances the strokes'
 * bounding box within the given print area — the "clean composition" half of
 * refinement. The line quality itself is handled separately via an SVG filter.
 */
export function refineTransform(
  strokes: DrawStroke[],
  target: { x: number; y: number; width: number; height: number },
  fill = 0.76,
): string {
  const bbox = strokesBBox(strokes);
  if (!bbox || bbox.width <= 0 || bbox.height <= 0) return "";

  const scale = Math.min((target.width * fill) / bbox.width, (target.height * fill) / bbox.height, 2.2);
  const srcCx = bbox.minX + bbox.width / 2;
  const srcCy = bbox.minY + bbox.height / 2;
  const targetCx = target.x + target.width / 2;
  const targetCy = target.y + target.height / 2;
  const tx = targetCx - scale * srcCx;
  const ty = targetCy - scale * srcCy;

  return `translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(3)})`;
}
