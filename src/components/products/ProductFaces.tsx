import type { ReactNode } from "react";
import type { ProductId } from "../../data/products";

/**
 * Non-apparel product renderers — stylized, flat-shaded SVG objects sharing
 * the same 360x440 viewBox as the garment system (see Garment.tsx's
 * VIEW_BOX), so the existing DrawLayer/ArtworkLayer overlays work here
 * completely unmodified: they only ever need a printArea rect in that same
 * coordinate space, never anything garment-specific.
 */

export interface PrintAreaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ProductSide = "front" | "back";

/** front = the single/primary view; back is repurposed per product ("wraparound", "angled") rather than a literal reverse side. */
export const PRODUCT_PRINT_AREAS: Partial<Record<ProductId, Record<ProductSide, PrintAreaRect>>> = {
  mug: {
    front: { x: 132, y: 156, width: 96, height: 92 },
    back: { x: 58, y: 156, width: 244, height: 92 },
  },
  poster: {
    front: { x: 44, y: 34, width: 272, height: 372 },
    back: { x: 44, y: 34, width: 272, height: 372 },
  },
  bottle: {
    front: { x: 150, y: 148, width: 60, height: 140 },
    back: { x: 90, y: 148, width: 180, height: 140 },
  },
  deskpad: {
    front: { x: 34, y: 176, width: 292, height: 92 },
    back: { x: 34, y: 176, width: 292, height: 92 },
  },
  phonecase: {
    front: { x: 104, y: 158, width: 152, height: 198 },
    back: { x: 104, y: 158, width: 152, height: 198 },
  },
};

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

interface FaceProps {
  colorHex: string;
  side: ProductSide;
  overlay?: ReactNode;
  variants: Record<string, string>;
}

const SHADOW = "rgba(23,21,26,0.16)";

/** A faint dashed outline marking the print-safe area — visible enough to guide placement, subtle enough not to look like part of the product. */
function PrintAreaGuide({ area }: { area: PrintAreaRect }) {
  return (
    <rect
      x={area.x}
      y={area.y}
      width={area.width}
      height={area.height}
      fill="none"
      stroke="#9a6a43"
      strokeOpacity={0.28}
      strokeDasharray="5 4"
      strokeWidth={1}
      rx={6}
    />
  );
}

/* ---------------------------------------------------------------- MUG --- */

export function MugFace({ colorHex, side, overlay, variants }: FaceProps) {
  const wrap = side === "back";
  const area = PRODUCT_PRINT_AREAS.mug![side];
  const glossy = variants.finish !== "matte";

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <ellipse cx="180" cy="368" rx="92" ry="14" fill={SHADOW} opacity="0.5" />
      {wrap ? (
        <>
          {/* flattened wraparound strip */}
          <rect x="50" y="140" width="260" height="120" rx="10" fill={colorHex} stroke={darken(colorHex, 30)} strokeWidth="1.5" />
          <rect x="50" y="140" width="260" height="18" rx="9" fill={lighten(colorHex, 30)} opacity={glossy ? 0.35 : 0.15} />
          <text x="180" y="130" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="2" fill="#9a9086">
            WRAPAROUND — WILL CURVE AROUND THE MUG
          </text>
        </>
      ) : (
        <>
          <path d="M120 150 h120 v130 a60 60 0 0 1 -120 0 z" fill={colorHex} stroke={darken(colorHex, 30)} strokeWidth="1.5" />
          <path d="M120 150 h120 v14 h-120 z" fill={lighten(colorHex, 35)} opacity={glossy ? 0.4 : 0.18} />
          <path
            d="M240 180 q34 4 34 34 q0 32 -34 36"
            fill="none"
            stroke={darken(colorHex, 20)}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path d="M240 180 q34 4 34 34 q0 32 -34 36" fill="none" stroke={colorHex} strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      <PrintAreaGuide area={area} />
      {overlay}
    </svg>
  );
}

/* -------------------------------------------------------------- POSTER --- */

export function PosterFace({ colorHex, overlay, variants }: FaceProps) {
  const frame = variants.frame ?? "none";
  const frameHex = frame === "black" ? "#17140f" : frame === "white" ? "#f1ead9" : frame === "walnut" ? "#5a3a26" : null;
  const orientation = variants.orientation ?? "portrait";
  const isLandscape = orientation === "landscape";
  const isSquare = orientation === "square";

  const outer = isLandscape ? { x: 20, y: 90, w: 320, h: 220 } : isSquare ? { x: 60, y: 60, w: 240, h: 240 } : { x: 60, y: 20, w: 240, h: 360 };

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <rect x={outer.x - 6} y={outer.y + outer.h + 2} width={outer.w + 12} height="8" fill={SHADOW} opacity="0.4" rx="4" />
      {frameHex && (
        <rect x={outer.x - 14} y={outer.y - 14} width={outer.w + 28} height={outer.h + 28} rx="4" fill={frameHex} stroke={darken(frameHex, 25)} strokeWidth="1" />
      )}
      <rect x={outer.x} y={outer.y} width={outer.w} height={outer.h} fill={colorHex} stroke={frameHex ? "none" : "#d8cdb8"} strokeWidth="1.5" />
      <PrintAreaGuide area={{ x: outer.x, y: outer.y, width: outer.w, height: outer.h }} />
      <g>{overlay}</g>
    </svg>
  );
}

/* -------------------------------------------------------------- BOTTLE --- */

export function BottleFace({ colorHex, side, overlay, variants }: FaceProps) {
  const angled = side === "back";
  const lidHex = variants.lid === "flip" ? "#2f2a24" : darken(colorHex, 40);
  const area = PRODUCT_PRINT_AREAS.bottle![side];
  const groupTransform = angled ? "rotate(-8 180 240) skewX(-2)" : undefined;

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <ellipse cx="180" cy="392" rx="46" ry="10" fill={SHADOW} opacity="0.5" />
      <g transform={groupTransform}>
        <rect x="152" y="60" width="56" height="18" rx="6" fill={lidHex} />
        <rect x="160" y="40" width="40" height="24" rx="8" fill={lidHex} />
        <path d="M150 78 q-20 10 -20 46 v210 a50 50 0 0 0 100 0 v-210 q0 -36 -20 -46 z" fill={colorHex} stroke={darken(colorHex, 30)} strokeWidth="1.5" />
        <path d="M150 78 q-20 10 -20 46 v40 h100 v-40 q0 -36 -20 -46 z" fill={lighten(colorHex, 28)} opacity="0.3" />
      </g>
      <g transform={groupTransform}>
        <PrintAreaGuide area={area} />
        {overlay}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------ DESK PAD --- */

export function DeskPadFace({ colorHex, overlay, variants }: FaceProps) {
  const edge = variants.edge === "stitched";

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      {/* subtle desk-surface context so the wide pad doesn't float in empty space */}
      <rect x="0" y="0" width="360" height="440" fill="#efe6d6" opacity="0.35" />
      <rect x="20" y="160" width="320" height="120" rx="14" fill={SHADOW} opacity="0.25" />
      <rect x="24" y="164" width="312" height="112" rx="12" fill={colorHex} stroke={darken(colorHex, 25)} strokeWidth={edge ? 2.5 : 1.5} strokeDasharray={edge ? "1 0" : undefined} />
      {edge && <rect x="27" y="167" width="306" height="106" rx="10" fill="none" stroke={lighten(colorHex, 40)} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />}
      {/* a hint of desk objects for context, kept minimal */}
      <rect x="270" y="120" width="46" height="40" rx="4" fill="#d8cdb8" opacity="0.6" />
      <circle cx="80" cy="130" r="16" fill="#d8cdb8" opacity="0.4" />
      <PrintAreaGuide area={PRODUCT_PRINT_AREAS.deskpad!.front} />
      <g>{overlay}</g>
    </svg>
  );
}

/* --------------------------------------------------------- PHONE CASE --- */

export function PhoneCaseFace({ colorHex, side, overlay, variants }: FaceProps) {
  const angled = side === "back";
  const clear = variants.type === "clear";
  const finish = variants.finish === "matte" ? 0.12 : 0.32;
  const area = PRODUCT_PRINT_AREAS.phonecase![side];
  const groupTransform = angled ? "rotate(-6 180 250) skewY(1)" : undefined;

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <ellipse cx="180" cy="400" rx="70" ry="12" fill={SHADOW} opacity="0.4" />
      <g transform={groupTransform}>
        <rect x="96" y="70" width="168" height="320" rx="34" fill={clear ? "#f4f4f4" : colorHex} opacity={clear ? 0.25 : 1} stroke={darken(clear ? "#cfcfcf" : colorHex, 30)} strokeWidth="1.5" />
        <rect x="96" y="70" width="168" height="60" rx="30" fill={lighten(colorHex, 40)} opacity={finish} />
        {/* camera safe-zone cutout, upper-left — the print area rect stays clear of this always */}
        <rect x="112" y="86" width="66" height="66" rx="16" fill="#1a1712" opacity="0.85" />
        <circle cx="132" cy="106" r="10" fill="#2a2622" />
        <circle cx="158" cy="106" r="10" fill="#2a2622" />
        <circle cx="132" cy="132" r="10" fill="#2a2622" />
        <rect x="150" y="380" width="60" height="4" rx="2" fill={darken(colorHex, 40)} opacity="0.5" />
      </g>
      <g transform={groupTransform}>
        <PrintAreaGuide area={area} />
        {overlay}
      </g>
    </svg>
  );
}
