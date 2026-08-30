import { useEffect, useState } from "react";
import { GarmentStage } from "../Garment";
import { IconSparkle, IconCheck } from "../icons";

type Phase = "blank" | "drawing" | "refining" | "refined";

const STAR_POINTS: [number, number][] = [
  [0, -22],
  [6.5, -7],
  [22, -7],
  [10.5, 3],
  [13.6, 19],
  [0, 9],
  [-13.6, 19],
  [-10.5, 3],
  [-22, -7],
  [-6.5, -7],
  [0, -22],
];

function jitter(pts: [number, number][], seed: number): [number, number][] {
  return pts.map(([x, y], i) => {
    const a = Math.sin(i * 12.9898 + seed) * 43758.5453;
    const b = Math.sin(i * 78.233 + seed) * 12345.6789;
    const nx = ((a - Math.floor(a)) * 2 - 1) * 3.6;
    const ny = ((b - Math.floor(b)) * 2 - 1) * 3.6;
    return [x + nx, y + ny];
  });
}

function toPath(pts: [number, number][], cx: number, cy: number, scale = 2.7): string {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(cx + x * scale).toFixed(1)},${(cy + y * scale).toFixed(1)}`).join(" ");
}

const ROUGH_D = toPath(jitter(STAR_POINTS, 4), 180, 200);
const CLEAN_D = toPath(STAR_POINTS, 180, 200);

function SketchPath({ phase }: { phase: Phase }) {
  if (phase === "blank") return null;
  const showClean = phase === "refined";
  return (
    <g>
      <path
        d={ROUGH_D}
        fill="none"
        stroke="#1a1712"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset: 0,
          animation: phase === "drawing" ? "draw-in 1.1s cubic-bezier(0.65,0,0.35,1) both" : "none",
          opacity: showClean ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />
      <path
        d={CLEAN_D}
        fill="none"
        stroke="#1a1712"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: showClean ? 1 : 0, transition: "opacity 0.6s ease 0.1s" }}
      />
    </g>
  );
}

export default function SlideDraw({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("blank");

  useEffect(() => {
    if (!active) {
      setPhase("blank");
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase("drawing"), 350),
      window.setTimeout(() => setPhase("refining"), 1600),
      window.setTimeout(() => setPhase("refined"), 2800),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  const colorHex = phase === "refined" ? "#17140f" : "#f1ead9";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-14 sm:px-14 sm:py-16">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        Start with nothing
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2.2rem,7.5vw,3.8rem)] leading-[1.0] tracking-tight text-ink [animation-delay:140ms]">
        Draw your own.
      </h1>
      <p className="animate-fade-up mt-2 text-center text-[14.5px] text-ink-soft [animation-delay:200ms]">No design skills required.</p>

      <div className="relative mt-6 aspect-square w-full max-w-[260px] rounded-[28px] border border-line-soft bg-paper p-7 shadow-[0_30px_70px_-35px_rgba(26,23,18,0.35)] sm:max-w-[300px]">
        <GarmentStage garment="tshirt" colorHex={colorHex} view="front" className="h-full w-full" frontOverlay={<SketchPath phase={phase} />} />
        {phase === "refining" && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-[11px] font-medium text-clay-deep animate-fade-in">
            <IconSparkle className="h-3.5 w-3.5 animate-pulse" /> Refining your idea…
          </div>
        )}
        {phase === "refined" && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink animate-fade-in">
            <IconCheck className="h-3.5 w-3.5 text-clay-deep" /> Refined &amp; ready
          </div>
        )}
      </div>

      <p className="animate-fade-up mt-6 max-w-xs text-center text-[14.5px] leading-relaxed text-ink-soft [animation-delay:220ms]">
        Draw it rough. We'll help make it real.
      </p>
      <p className="mt-3 text-center font-display text-lg italic text-ink">"Your canvas. Your rules."</p>
      <p className="mt-1.5 max-w-xs text-center text-[12.5px] text-ink-faint">
        Your sketch doesn't have to be perfect. Don't worry about the details — just draw.
      </p>
    </div>
  );
}
