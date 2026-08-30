import { useEffect, useState } from "react";
import type { GarmentType, FitId } from "../../data/catalog";
import { GarmentStage } from "../Garment";
import DrawLayer from "./DrawLayer";
import type { DrawStroke } from "../../lib/store";
import { IconSparkle, IconCheck } from "../icons";

interface RefineDrawingProps {
  garment: GarmentType;
  colorHex: string;
  side: "front" | "back";
  fit?: FitId;
  accentTrim?: boolean;
  pocketVisible?: boolean;
  strokes: DrawStroke[];
  printArea: { x: number; y: number; width: number; height: number };
  onKeep: () => void;
  onEditAgain: () => void;
}

export default function RefineDrawing({ garment, colorHex, side, fit, accentTrim, pocketVisible, strokes, printArea, onKeep, onEditAgain }: RefineDrawingProps) {
  const [phase, setPhase] = useState<"refining" | "compare">("refining");

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("compare"), 1400);
    return () => window.clearTimeout(t);
  }, []);

  const original = <DrawLayer strokes={strokes} interactive={false} />;
  const refined = <DrawLayer strokes={strokes} interactive={false} refined printArea={printArea} />;

  const props = {
    garment,
    colorHex,
    fit,
    accentTrim,
    pocketVisible,
    className: "h-full w-full",
  } as const;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ivory animate-fade-in">
      <div className="grain absolute inset-0 opacity-50" />

      {phase === "refining" ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-ivory">
            <IconSparkle className="h-6 w-6 animate-pulse" />
          </div>
          <p className="mt-6 font-display text-2xl text-ink">Refining your idea…</p>
          <p className="mt-2 max-w-xs text-[14px] text-ink-soft">
            Your sketch doesn't need to be perfect. We'll help turn it into something production-ready.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
          <p className="animate-fade-up text-center text-[11px] uppercase tracking-[0.25em] text-ink-faint">Refining your idea</p>
          <h1 className="animate-fade-up mt-1.5 text-center font-display text-3xl text-ink [animation-delay:60ms]">Original → FORMÉ Refined</h1>
          <p className="animate-fade-up mt-2 max-w-xs text-center text-[13.5px] text-ink-soft [animation-delay:100ms]">
            We kept your idea — just cleaned up the lines, balance and placement.
          </p>

          <div className="animate-fade-up mt-8 flex w-full max-w-md items-center justify-center gap-4 [animation-delay:140ms]">
            <div className="flex-1">
              <p className="mb-2 text-center text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">Original</p>
              <div className="aspect-square rounded-3xl border border-line-soft bg-paper p-6 shadow-[0_20px_50px_-30px_rgba(26,23,18,0.35)]">
                <GarmentStage {...props} view={side} frontOverlay={side === "front" ? original : undefined} backOverlay={side === "back" ? original : undefined} />
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-2 flex items-center justify-center gap-1 text-center text-[10.5px] uppercase tracking-[0.16em] text-clay-deep">
                <IconSparkle className="h-3 w-3" /> Refined
              </p>
              <div className="aspect-square rounded-3xl border border-clay/40 bg-paper p-6 shadow-[0_20px_50px_-30px_rgba(26,23,18,0.35)]">
                <GarmentStage {...props} view={side} frontOverlay={side === "front" ? refined : undefined} backOverlay={side === "back" ? refined : undefined} />
              </div>
            </div>
          </div>

          <div className="animate-fade-up mt-8 flex w-full max-w-xs flex-col gap-2.5 [animation-delay:200ms]">
            <button
              onClick={onKeep}
              className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory transition-transform hover:-translate-y-0.5"
            >
              <IconCheck className="h-4 w-4" /> Keep Refined Version
            </button>
            <button onClick={onEditAgain} className="rounded-full border border-line py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-soft">
              Edit Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
