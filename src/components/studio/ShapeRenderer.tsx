import { shapePath, type ShapeId } from "../../lib/shapes";

export const GRAPHIC_BASE = 60; // local shape coordinate space is roughly -20..20 within this box, before scale

export default function ShapeRenderer({ shape, color, flipX, flipY }: { shape: ShapeId; color: string; flipX?: boolean; flipY?: boolean }) {
  const { d, kind } = shapePath(shape);
  const scaleTransform = `scale(${flipX ? -1 : 1},${flipY ? -1 : 1})`;
  return (
    <g transform={scaleTransform}>
      {kind === "fill" ? (
        <path d={d} fill={color} stroke="none" />
      ) : (
        <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}
