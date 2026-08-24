import { useRef, useState, useCallback, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { GarmentType, ViewMode } from "../data/catalog";

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

function TeeNeckShadow({ neckDepth }: { neckDepth: number }) {
  return (
    <path
      d={`M149,52 Q180,${55 + neckDepth} 211,52 Z`}
      fill="#1a1712"
      opacity={0.26}
      stroke="none"
    />
  );
}

function TeeCollar({ neckDepth }: { neckDepth: number }) {
  return (
    <path
      d={`M158,53 Q180,${50 + neckDepth * 0.68} 202,53`}
      fill="none"
      strokeWidth={3.5}
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

function HoodiePocket() {
  return (
    <path
      d="M118,258 C118,240 138,230 180,230 C222,230 242,240 242,258
         L238,318 C238,334 216,344 180,344 C144,344 122,334 122,318 Z"
      fill="none"
      strokeWidth={2.5}
      opacity={0.75}
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
      <path
        d="M162,86 C142,94 126,116 120,142"
        fill="none"
        strokeWidth={2.5}
        opacity={0.3}
      />
      <path
        d="M180,84 C180,84 180,140 180,182"
        fill="none"
        strokeWidth={2}
        opacity={0.22}
      />
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

interface FaceProps {
  garment: GarmentType;
  colorHex: string;
  side: "front" | "back";
  overlay?: ReactNode;
  printArea: { x: number; y: number; width: number; height: number };
  showPrintHint?: boolean;
  accentTrim?: boolean;
}

function Face({ garment, colorHex, side, overlay, printArea, showPrintHint, accentTrim }: FaceProps) {
  const clipId = `clip-${garment}-${side}`;
  const shadeId = `shade-${garment}-${side}`;

  return (
    <svg viewBox={VIEW_BOX} className="h-full w-full overflow-visible" style={{ color: colorHex }}>
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
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </radialGradient>
        <linearGradient id={`hem-${shadeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* drop shadow */}
      <ellipse cx="180" cy="420" rx="130" ry="16" fill="#1a1712" opacity="0.08" />

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
        {garment === "tshirt" && <TeeNeckShadow neckDepth={side === "front" ? 38 : 20} />}
      </g>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="360" height="440" fill={`url(#${shadeId})`} />
        <rect x="0" y="0" width="360" height="440" fill={`url(#hem-${shadeId})`} />
        {overlay}
      </g>

      <g stroke="#1a1712" strokeOpacity={0.16} fill="none">
        {garment === "tshirt" && <TeeBody neckDepth={side === "front" ? 38 : 20} />}
        {garment === "hoodie" && (
          <>
            <HoodieHood />
            <HoodieBody />
            {side === "front" && <HoodiePocket />}
          </>
        )}
        {garment === "cap" && (side === "front" ? <CapFront /> : <CapBack />)}
      </g>

      <g
        stroke={accentTrim ? "#9a6a43" : "#1a1712"}
        strokeOpacity={accentTrim ? 0.9 : 0.16}
        fill={accentTrim ? "#9a6a43" : "currentColor"}
        style={{ transition: "stroke 0.4s ease, fill 0.4s ease" }}
      >
        {garment === "tshirt" && side === "front" && <TeeCollar neckDepth={38} />}
        {garment === "hoodie" && side === "front" && <HoodieStrings />}
        {garment === "cap" && <circle cx="180" cy="84" r="5.5" fill={accentTrim ? "#9a6a43" : "#1a1712"} fillOpacity={accentTrim ? 1 : 0.55} />}
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

export function GarmentStage({ garment, colorHex, view, frontOverlay, backOverlay, showPrintHint, accentTrim, fit, className }: GarmentStageProps) {
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
          <Face garment={garment} colorHex={colorHex} side="front" overlay={frontOverlay} printArea={PRINT_AREAS[garment].front} showPrintHint={showPrintHint} accentTrim={accentTrim} />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <Face garment={garment} colorHex={colorHex} side="back" overlay={backOverlay} printArea={PRINT_AREAS[garment].back} showPrintHint={showPrintHint} accentTrim={accentTrim} />
        </div>
      </div>
    </div>
  );
}

export { VIEW_BOX };
