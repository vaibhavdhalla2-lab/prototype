import { useRef, useState, useCallback, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { GarmentType, ViewMode } from "../data/catalog";
import { threadTone } from "../lib/color";

const VIEW_BOX = "0 0 360 440";

/* ----------------------------------------------------------------------- */
/* Garment silhouette paths                                                 */
/* ----------------------------------------------------------------------- */

function TeeBody({ neckDepth }: { neckDepth: number }) {
  return (
    <path
      d={`M150,55
          Q180,${55 + neckDepth} 210,55
          L236,60
          Q280,66 294,104
          Q290,124 252,132
          L252,372
          Q252,380 244,380
          L116,380
          Q108,380 108,372
          L108,132
          Q70,124 66,104
          Q80,66 124,60
          Z`}
    />
  );
}

function HoodieBody() {
  return (
    <path
      d="M132,95
         L228,95
         L250,100
         Q290,112 300,160
         Q296,184 258,192
         L258,408
         Q258,416 250,416
         L110,416
         Q102,416 102,408
         L102,192
         Q64,184 60,160
         Q70,112 110,100
         Z"
    />
  );
}

function HoodieHood() {
  return (
    <path
      d="M134,98
         C130,66 152,50 180,50
         C208,50 230,66 226,98
         C226,104 219,105 210,100
         C202,96 192,93 180,93
         C168,93 158,96 150,100
         C141,105 134,104 134,98 Z"
    />
  );
}

function HoodieStrings() {
  return (
    <g fill="none" strokeWidth={2.5} strokeLinecap="round" opacity={0.75}>
      <path d="M166,96 C162,112 160,128 162,144" />
      <path d="M194,96 C198,112 200,128 198,144" />
      <circle cx="162" cy="144" r="3.5" fill="currentColor" stroke="none" />
      <circle cx="198" cy="144" r="3.5" fill="currentColor" stroke="none" />
    </g>
  );
}

function CapCrown() {
  return <path d="M94,180 C94,112 130,82 180,82 C230,82 266,112 266,180 L266,184 L94,184 Z" />;
}

function CapFront() {
  return (
    <g>
      <CapCrown />
      <path d="M88,182 Q180,196 272,182 Q272,198 180,216 Q88,198 88,182 Z" />
      <path d="M162,86 C142,94 126,116 120,142" fill="none" strokeWidth={2.5} opacity={0.3} />
      <path d="M180,84 C180,84 180,140 180,182" fill="none" strokeWidth={2} opacity={0.22} />
      <circle cx="180" cy="84" r="5.5" />
    </g>
  );
}

function CapBack() {
  return (
    <g>
      <CapCrown />
      <path d="M136,180 L158,180 L162,210 Q162,218 154,216 L146,212 L138,216 Q130,218 130,210 Z" />
      <path d="M202,180 L224,180 L230,210 Q230,218 222,216 L214,212 L206,216 Q198,218 198,210 Z" />
      <path d="M168,182 L192,182 L190,200 L170,200 Z" fill="none" strokeWidth={2} opacity={0.4} />
      <circle cx="180" cy="84" r="5.5" />
      <path d="M150,88 C150,88 138,118 130,140 M210,88 C210,88 222,118 230,140" fill="none" strokeWidth={2} opacity={0.22} />
    </g>
  );
}

/* ----------------------------------------------------------------------- */
/* Fabric realism: grain texture, fold shadows, stitching                   */
/* ----------------------------------------------------------------------- */

interface ShadeBlob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
  tone: "dark" | "light";
  rotate?: number;
}

const FOLD_BLOBS: Record<GarmentType, Record<"front" | "back", ShadeBlob[]>> = {
  tshirt: {
    front: [
      { cx: 118, cy: 148, rx: 24, ry: 36, opacity: 0.22, tone: "dark", rotate: -18 },
      { cx: 242, cy: 148, rx: 24, ry: 36, opacity: 0.22, tone: "dark", rotate: 18 },
      { cx: 90, cy: 92, rx: 20, ry: 28, opacity: 0.13, tone: "light", rotate: -32 },
      { cx: 270, cy: 92, rx: 20, ry: 28, opacity: 0.13, tone: "light", rotate: 32 },
      { cx: 76, cy: 112, rx: 15, ry: 26, opacity: 0.15, tone: "dark", rotate: -32 },
      { cx: 284, cy: 112, rx: 15, ry: 26, opacity: 0.15, tone: "dark", rotate: 32 },
      { cx: 195, cy: 175, rx: 66, ry: 38, opacity: 0.09, tone: "light", rotate: -10 },
      { cx: 175, cy: 255, rx: 60, ry: 50, opacity: 0.05, tone: "dark" },
      { cx: 180, cy: 355, rx: 92, ry: 26, opacity: 0.12, tone: "dark" },
    ],
    back: [
      { cx: 118, cy: 130, rx: 24, ry: 34, opacity: 0.2, tone: "dark", rotate: -18 },
      { cx: 242, cy: 130, rx: 24, ry: 34, opacity: 0.2, tone: "dark", rotate: 18 },
      { cx: 90, cy: 92, rx: 20, ry: 28, opacity: 0.12, tone: "light", rotate: -32 },
      { cx: 270, cy: 92, rx: 20, ry: 28, opacity: 0.12, tone: "light", rotate: 32 },
      { cx: 145, cy: 110, rx: 30, ry: 22, opacity: 0.08, tone: "dark", rotate: -8 },
      { cx: 215, cy: 110, rx: 30, ry: 22, opacity: 0.08, tone: "dark", rotate: 8 },
      { cx: 180, cy: 200, rx: 70, ry: 50, opacity: 0.06, tone: "light" },
      { cx: 180, cy: 355, rx: 92, ry: 26, opacity: 0.12, tone: "dark" },
    ],
  },
  hoodie: {
    front: [
      { cx: 118, cy: 175, rx: 26, ry: 42, opacity: 0.22, tone: "dark", rotate: -16 },
      { cx: 244, cy: 175, rx: 26, ry: 42, opacity: 0.22, tone: "dark", rotate: 16 },
      { cx: 95, cy: 122, rx: 22, ry: 30, opacity: 0.13, tone: "light", rotate: -28 },
      { cx: 267, cy: 122, rx: 22, ry: 30, opacity: 0.13, tone: "light", rotate: 28 },
      { cx: 180, cy: 220, rx: 60, ry: 26, opacity: 0.16, tone: "dark" },
      { cx: 180, cy: 130, rx: 60, ry: 30, opacity: 0.08, tone: "light" },
      { cx: 180, cy: 380, rx: 100, ry: 28, opacity: 0.13, tone: "dark" },
      { cx: 180, cy: 66, rx: 46, ry: 16, opacity: 0.14, tone: "dark" },
    ],
    back: [
      { cx: 118, cy: 165, rx: 26, ry: 40, opacity: 0.2, tone: "dark", rotate: -16 },
      { cx: 244, cy: 165, rx: 26, ry: 40, opacity: 0.2, tone: "dark", rotate: 16 },
      { cx: 95, cy: 122, rx: 22, ry: 30, opacity: 0.12, tone: "light", rotate: -28 },
      { cx: 267, cy: 122, rx: 22, ry: 30, opacity: 0.12, tone: "light", rotate: 28 },
      { cx: 180, cy: 110, rx: 66, ry: 34, opacity: 0.12, tone: "dark" },
      { cx: 180, cy: 230, rx: 76, ry: 60, opacity: 0.06, tone: "light" },
      { cx: 180, cy: 388, rx: 100, ry: 28, opacity: 0.13, tone: "dark" },
    ],
  },
  cap: {
    front: [
      { cx: 128, cy: 135, rx: 26, ry: 60, opacity: 0.13, tone: "dark", rotate: -6 },
      { cx: 232, cy: 135, rx: 26, ry: 60, opacity: 0.13, tone: "dark", rotate: 6 },
      { cx: 180, cy: 105, rx: 34, ry: 34, opacity: 0.12, tone: "light" },
      { cx: 180, cy: 190, rx: 70, ry: 14, opacity: 0.2, tone: "dark" },
    ],
    back: [
      { cx: 128, cy: 135, rx: 26, ry: 60, opacity: 0.12, tone: "dark", rotate: -6 },
      { cx: 232, cy: 135, rx: 26, ry: 60, opacity: 0.12, tone: "dark", rotate: 6 },
      { cx: 180, cy: 190, rx: 60, ry: 14, opacity: 0.16, tone: "dark" },
    ],
  },
};

function FoldShadows({ blobs, filterId }: { blobs: ShadeBlob[]; filterId: string }) {
  return (
    <g filter={`url(#${filterId})`} style={{ mixBlendMode: "multiply" }}>
      {blobs.map((b, i) => (
        <ellipse
          key={i}
          cx={b.cx}
          cy={b.cy}
          rx={b.rx}
          ry={b.ry}
          fill={b.tone === "dark" ? "#050403" : "#ffffff"}
          opacity={b.tone === "dark" ? b.opacity * 0.85 : b.opacity * 0.65}
          style={b.tone === "light" ? { mixBlendMode: "soft-light" } : undefined}
          transform={b.rotate ? `rotate(${b.rotate} ${b.cx} ${b.cy})` : undefined}
        />
      ))}
    </g>
  );
}

/** A grooved-thread stitch line: a dark recessed groove with a lighter dashed thread on top. */
function Stitch({ d, tone, width = 1 }: { d: string; tone: string; width?: number }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#050403" strokeOpacity={0.22} strokeWidth={2.1 * width} />
      <path d={d} stroke={tone} strokeOpacity={0.8} strokeWidth={0.9 * width} strokeDasharray={`${2.6 * width} ${2.2 * width}`} />
    </g>
  );
}

const RIB_PATTERNS = {
  teeCollar: (neckDepth: number) => `M158,53 Q180,${50 + neckDepth * 0.68} 202,53`,
  hoodieHood: "M134,98 C130,66 152,50 180,50 C208,50 230,66 226,98",
  capSeamLeft: "M162,86 C142,94 126,116 120,142",
  capSeamRight: "M198,86 C218,94 234,116 240,142",
};

/* ----------------------------------------------------------------------- */

interface FaceProps {
  garment: GarmentType;
  colorHex: string;
  side: "front" | "back";
  overlay?: ReactNode;
  printArea: { x: number; y: number; width: number; height: number };
  showPrintHint?: boolean;
  accentTrim?: boolean;
  pocketVisible?: boolean;
}

function Face({ garment, colorHex, side, overlay, printArea, showPrintHint, accentTrim, pocketVisible = true }: FaceProps) {
  const clipId = `clip-${garment}-${side}`;
  const shadeId = `shade-${garment}-${side}`;
  const grainId = `grain-${garment}-${side}`;
  const blurId = `blur-${garment}-${side}`;
  const thread = accentTrim ? "#9a6a43" : threadTone(colorHex);
  const grainSeed = side === "front" ? 4 : 9;
  const blobs = FOLD_BLOBS[garment][side];

  return (
    <svg viewBox={VIEW_BOX} className="h-full w-full overflow-visible" style={{ color: colorHex, transition: "color 0.6s ease" }}>
      <defs>
        <clipPath id={clipId}>
          {garment === "tshirt" && <TeeBody neckDepth={side === "front" ? 38 : 20} />}
          {garment === "hoodie" && (
            <>
              <HoodieHood />
              <HoodieBody />
            </>
          )}
          {garment === "cap" && (side === "front" ? <CapFront /> : <CapBack />)}
        </clipPath>

        <radialGradient id={shadeId} cx="38%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
        <linearGradient id={`hem-${shadeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>

        <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="15" />
        </filter>

        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={grainSeed} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>

        <filter id={`embroidery-${garment}-${side}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="1.1" dy="1.5" stdDeviation="0.5" floodColor="#000000" floodOpacity="0.4" />
          <feDropShadow dx="-0.6" dy="-0.6" stdDeviation="0.3" floodColor="#ffffff" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* drop shadow on the surface below */}
      <ellipse cx="180" cy="420" rx="130" ry="16" fill="#1a1712" opacity="0.08" />

      {/* base fill */}
      <g fill="currentColor">
        {garment === "tshirt" && <TeeBody neckDepth={side === "front" ? 38 : 20} />}
        {garment === "hoodie" && (
          <>
            <HoodieHood />
            <path
              d="M134,98 C130,66 152,50 180,50 C208,50 230,66 226,98 C226,104 219,105 210,100 C202,96 192,93 180,93 C168,93 158,96 150,100 C141,105 134,104 134,98 Z"
              fill="#1a1712"
              opacity={0.1}
            />
            <HoodieBody />
          </>
        )}
        {garment === "cap" && (side === "front" ? <CapFront /> : <CapBack />)}
        {garment === "tshirt" && (
          <path
            d={`M149,52 Q180,${side === "front" ? 93 : 75} 211,52 Z`}
            fill="#1a1712"
            opacity={0.26}
          />
        )}
      </g>

      {/* everything below is clipped to the garment silhouette */}
      <g clipPath={`url(#${clipId})`} pointerEvents="none">
        {/* woven fabric grain */}
        <rect x="0" y="0" width="360" height="440" filter={`url(#${grainId})`} opacity={0.5} style={{ mixBlendMode: "overlay" }} />

        {/* directional studio light */}
        <rect x="0" y="0" width="360" height="440" fill={`url(#${shadeId})`} />
        <rect x="0" y="0" width="360" height="440" fill={`url(#hem-${shadeId})`} />

        {/* natural fabric folds and drape */}
        <FoldShadows blobs={blobs} filterId={blurId} />

        {/* user artwork / drawing / text */}
        <g pointerEvents="auto">{overlay}</g>

        {/* a second, gentler light pass so artwork inherits the same fold lighting */}
        <rect x="0" y="0" width="360" height="440" fill={`url(#${shadeId})`} opacity={0.35} style={{ mixBlendMode: "soft-light" }} />
      </g>

      {/* construction seams */}
      <g opacity={0.9}>
        {garment === "tshirt" && (
          <Stitch d={`M150,55 Q180,${55 + (side === "front" ? 38 : 20)} 210,55 L236,60 Q280,66 294,104 Q290,124 252,132 L252,372 Q252,380 244,380 L116,380 Q108,380 108,372 L108,132 Q70,124 66,104 Q80,66 124,60 Z`} tone={thread} />
        )}
        {garment === "hoodie" && (
          <>
            <Stitch d="M132,95 L228,95 L250,100 Q290,112 300,160 Q296,184 258,192 L258,408 Q258,416 250,416 L110,416 Q102,416 102,408 L102,192 Q64,184 60,160 Q70,112 110,100 Z" tone={thread} />
            <Stitch d={RIB_PATTERNS.hoodieHood} tone={thread} width={1.2} />
            {side === "front" && pocketVisible && <Stitch d="M118,258 C118,240 138,230 180,230 C222,230 242,240 242,258 L238,318 C238,334 216,344 180,344 C144,344 122,334 122,318 Z" tone={thread} />}
          </>
        )}
        {garment === "cap" && (
          <>
            <Stitch d="M94,180 C94,112 130,82 180,82 C230,82 266,112 266,180" tone={thread} />
            <Stitch d={RIB_PATTERNS.capSeamLeft} tone={thread} width={0.85} />
            <Stitch d={RIB_PATTERNS.capSeamRight} tone={thread} width={0.85} />
            {side === "front" ? (
              <Stitch d="M88,182 Q180,196 272,182" tone={thread} width={1.3} />
            ) : (
              <Stitch d="M136,180 L158,180 M202,180 L224,180" tone={thread} />
            )}
          </>
        )}
      </g>

      {/* rib / trim accent (collar, drawcords, button) */}
      <g
        stroke={thread}
        strokeOpacity={accentTrim ? 0.95 : 0.55}
        fill={thread}
        fillOpacity={accentTrim ? 1 : 0.7}
        style={{ transition: "stroke 0.4s ease, fill 0.4s ease" }}
      >
        {garment === "tshirt" && side === "front" && (
          <path d={RIB_PATTERNS.teeCollar(38)} fill="none" strokeWidth={3.2} />
        )}
        {garment === "hoodie" && side === "front" && <HoodieStrings />}
        {garment === "cap" && <circle cx="180" cy="84" r="5.5" />}
      </g>

      {showPrintHint && (
        <rect
          x={printArea.x}
          y={printArea.y}
          width={printArea.width}
          height={printArea.height}
          fill="none"
          stroke="#9a6a43"
          strokeOpacity={0.35}
          strokeDasharray="6 6"
          strokeWidth={1.5}
          rx={4}
        />
      )}
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/* Print areas per garment/side, in the 360x440 viewBox coordinate space    */
/* ----------------------------------------------------------------------- */

export const PRINT_AREAS: Record<GarmentType, { front: { x: number; y: number; width: number; height: number }; back: { x: number; y: number; width: number; height: number } }> = {
  tshirt: {
    front: { x: 138, y: 120, width: 84, height: 92 },
    back: { x: 126, y: 104, width: 108, height: 124 },
  },
  hoodie: {
    front: { x: 138, y: 150, width: 84, height: 84 },
    back: { x: 122, y: 130, width: 116, height: 150 },
  },
  cap: {
    front: { x: 150, y: 128, width: 60, height: 32 },
    back: { x: 150, y: 128, width: 60, height: 32 },
  },
};

/* ----------------------------------------------------------------------- */

export interface GarmentStageProps {
  garment: GarmentType;
  colorHex: string;
  view: ViewMode;
  frontOverlay?: ReactNode;
  backOverlay?: ReactNode;
  showPrintHint?: boolean;
  accentTrim?: boolean;
  pocketVisible?: boolean;
  fit?: "oversized" | "relaxed" | "regular" | "cropped";
  className?: string;
}

/**
 * Renders the garment as a draggable pseudo-3D card: FRONT / BACK snap to
 * 0deg / 180deg on the Y axis, and "3d" mode lets the user drag freely
 * between them, crossfading via backface-visibility (a flip-card trick).
 */
const FIT_SCALE: Record<NonNullable<GarmentStageProps["fit"]>, { x: number; y: number }> = {
  oversized: { x: 1.1, y: 1.04 },
  relaxed: { x: 1.03, y: 1.0 },
  regular: { x: 1, y: 1 },
  cropped: { x: 1, y: 0.86 },
};

export function GarmentStage({ garment, colorHex, view, frontOverlay, backOverlay, showPrintHint, accentTrim, pocketVisible, fit, className }: GarmentStageProps) {
  const [dragAngle, setDragAngle] = useState(-26);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const startAngle = useRef(0);

  const targetAngle = view === "front" ? 0 : view === "back" ? 180 : dragAngle;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (view !== "3d") return;
      dragging.current = true;
      lastX.current = e.clientX;
      startAngle.current = dragAngle;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [view, dragAngle],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    setDragAngle(startAngle.current + delta * 0.6);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className={`relative select-none ${className ?? ""}`}
      style={{ perspective: 1400, touchAction: view === "3d" ? "none" : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${targetAngle}deg) scale(${(fit ? FIT_SCALE[fit] : FIT_SCALE.regular).x}, ${(fit ? FIT_SCALE[fit] : FIT_SCALE.regular).y})`,
          transition: view === "3d" && dragging.current ? "none" : "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          cursor: view === "3d" ? (dragging.current ? "grabbing" : "grab") : "default",
        }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
          <Face garment={garment} colorHex={colorHex} side="front" overlay={frontOverlay} printArea={PRINT_AREAS[garment].front} showPrintHint={showPrintHint} accentTrim={accentTrim} pocketVisible={pocketVisible} />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <Face garment={garment} colorHex={colorHex} side="back" overlay={backOverlay} printArea={PRINT_AREAS[garment].back} showPrintHint={showPrintHint} accentTrim={accentTrim} pocketVisible={pocketVisible} />
        </div>
      </div>
    </div>
  );
}

export { VIEW_BOX };
