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
    back: { x: 132, y: 156, width: 96, height: 92 },
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

function MugHandle({ colorHex }: { colorHex: string }) {
  return (
    <>
      <path d="M240 180 q34 4 34 34 q0 32 -34 36" fill="none" stroke={darken(colorHex, 20)} strokeWidth="12" strokeLinecap="round" />
      <path d="M240 180 q34 4 34 34 q0 32 -34 36" fill="none" stroke={colorHex} strokeWidth="7" strokeLinecap="round" />
    </>
  );
}

/** Front and back are two independently-designable cup panels — back is a horizontal mirror so the handle reads on the opposite side. */
export function MugFace({ colorHex, side, overlay, variants }: FaceProps) {
  const area = PRODUCT_PRINT_AREAS.mug![side];
  const glossy = variants.finish !== "matte";
  const mirrored = side === "back";

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <ellipse cx="180" cy="368" rx="92" ry="14" fill={SHADOW} opacity="0.5" />
      <g transform={mirrored ? "translate(360,0) scale(-1,1)" : undefined}>
        <path d="M120 150 h120 v130 a60 60 0 0 1 -120 0 z" fill={colorHex} stroke={darken(colorHex, 30)} strokeWidth="1.5" />
        <path d="M120 150 h120 v14 h-120 z" fill={lighten(colorHex, 35)} opacity={glossy ? 0.4 : 0.18} />
        <MugHandle colorHex={colorHex} />
      </g>
      <PrintAreaGuide area={area} />
      {overlay}
      <text x="180" y="420" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="2" fill="#9a9086">
        {side === "front" ? "FRONT PANEL" : "BACK PANEL"}
      </text>
    </svg>
  );
}

/** Maps content drawn for `from` (an existing printArea) into the `to` rect via an affine transform — used to composite the front/back panels into the flattened wraparound strip without needing separate stored strokes. */
function rectTransform(from: PrintAreaRect, to: PrintAreaRect): string {
  const sx = to.width / from.width;
  const sy = to.height / from.height;
  const tx = to.x - from.x * sx;
  const ty = to.y - from.y * sy;
  return `translate(${tx} ${ty}) scale(${sx} ${sy})`;
}

/** Read-only reference view: shows how the independently-designed front/back panels combine into one flattened, curved-around-the-mug strip, with the handle zone clearly interrupting the surface. */
export function MugWrapFace({
  colorHex,
  variants,
  frontOverlay,
  backOverlay,
}: {
  colorHex: string;
  variants: Record<string, string>;
  frontOverlay?: ReactNode;
  backOverlay?: ReactNode;
}) {
  const glossy = variants.finish !== "matte";
  const strip = { x: 34, y: 168, width: 292, height: 104 };
  const leftTarget = { x: strip.x, y: strip.y, width: 112, height: strip.height };
  const handleZone = { x: strip.x + 116, y: strip.y, width: 60, height: strip.height };
  const rightTarget = { x: strip.x + 180, y: strip.y, width: 112, height: strip.height };
  const front = PRODUCT_PRINT_AREAS.mug!.front;
  const back = PRODUCT_PRINT_AREAS.mug!.back;

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <rect x={strip.x} y={strip.y} width={strip.width} height={strip.height} rx="8" fill={colorHex} stroke={darken(colorHex, 30)} strokeWidth="1.5" />
      <rect x={strip.x} y={strip.y} width={strip.width} height="14" fill={lighten(colorHex, 30)} opacity={glossy ? 0.35 : 0.15} />

      <rect x={handleZone.x} y={handleZone.y} width={handleZone.width} height={handleZone.height} fill="#1a1712" opacity="0.08" />
      <line x1={handleZone.x} y1={handleZone.y} x2={handleZone.x} y2={handleZone.y + handleZone.height} stroke="#1a1712" strokeOpacity="0.25" strokeDasharray="3 3" />
      <line x1={handleZone.x + handleZone.width} y1={handleZone.y} x2={handleZone.x + handleZone.width} y2={handleZone.y + handleZone.height} stroke="#1a1712" strokeOpacity="0.25" strokeDasharray="3 3" />
      <text x={handleZone.x + handleZone.width / 2} y={handleZone.y + handleZone.height / 2 + 3} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" letterSpacing="1.5" fill="#6b5636">
        HANDLE
      </text>

      <PrintAreaGuide area={leftTarget} />
      <PrintAreaGuide area={rightTarget} />
      <g transform={rectTransform(front, leftTarget)}>
        <clipPath id="mug-wrap-left">
          <rect x={front.x} y={front.y} width={front.width} height={front.height} />
        </clipPath>
        <g clipPath="url(#mug-wrap-left)">{frontOverlay}</g>
      </g>
      <g transform={rectTransform(back, rightTarget)}>
        <clipPath id="mug-wrap-right">
          <rect x={back.x} y={back.y} width={back.width} height={back.height} />
        </clipPath>
        <g clipPath="url(#mug-wrap-right)">{backOverlay}</g>
      </g>

      <text x={strip.x + 4} y={strip.y - 8} fontFamily="Inter, sans-serif" fontSize="8" letterSpacing="1.5" fill="#9a9086">
        LEFT EDGE
      </text>
      <text x={strip.x + strip.width - 4} y={strip.y - 8} textAnchor="end" fontFamily="Inter, sans-serif" fontSize="8" letterSpacing="1.5" fill="#9a9086">
        RIGHT EDGE
      </text>
      <text x="180" y={strip.y + strip.height + 22} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="2" fill="#9a9086">
        FLATTENED WRAPAROUND — CURVES AROUND THE MUG
      </text>
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
  const finish = variants.finish === "matte" ? 0.1 : 0.24;
  const area = PRODUCT_PRINT_AREAS.phonecase![side];
  const groupTransform = angled ? "rotate(-6 180 250) skewY(1)" : undefined;
  const bodyFill = clear ? "#f4f4f4" : colorHex;
  // The camera module is blended toward the case's own colour rather than
  // painted stark black, so a light case reads as a soft charcoal cutout
  // instead of a jarring high-contrast square.
  const moduleFill = darken(clear ? "#cfcfcf" : colorHex, 60);
  const lensFill = darken(clear ? "#cfcfcf" : colorHex, 78);

  return (
    <svg viewBox="0 0 360 440" className="h-full w-full overflow-visible">
      <ellipse cx="180" cy="400" rx="70" ry="12" fill={SHADOW} opacity="0.4" />
      <g transform={groupTransform}>
        <rect x="96" y="70" width="168" height="320" rx="34" fill={bodyFill} opacity={clear ? 0.25 : 1} stroke={darken(clear ? "#cfcfcf" : colorHex, 30)} strokeWidth="1.5" />
        <rect x="96" y="70" width="168" height="60" rx="30" fill={lighten(colorHex, 40)} opacity={finish} />
        {/* camera module — small, rounded and colour-matched to the case, not a stark black block */}
        <rect x="118" y="88" width="46" height="46" rx="14" fill={moduleFill} opacity={clear ? 0.55 : 0.92} />
        <circle cx="133" cy="103" r="7.5" fill={lensFill} />
        <circle cx="149" cy="103" r="7.5" fill={lensFill} />
        <circle cx="133" cy="119" r="7.5" fill={lensFill} />
        <circle cx="133" cy="103" r="2.6" fill="#0d0b09" opacity="0.55" />
        <circle cx="149" cy="103" r="2.6" fill="#0d0b09" opacity="0.55" />
        <circle cx="133" cy="119" r="2.6" fill="#0d0b09" opacity="0.55" />
        <circle cx="152" cy="119" r="3.2" fill={lensFill} opacity="0.7" />
        <rect x="150" y="380" width="60" height="4" rx="2" fill={darken(colorHex, 40)} opacity="0.5" />
      </g>
      <g transform={groupTransform}>
        <PrintAreaGuide area={area} />
        {overlay}
      </g>
    </svg>
  );
}
