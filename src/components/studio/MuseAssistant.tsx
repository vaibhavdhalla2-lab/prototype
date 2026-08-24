import { useState } from "react";
import { useDesign } from "../../lib/store";
import { museMaterialRecommendation, MUSE_PROMPT_CHIPS } from "../../lib/muse";
import { materialById } from "../../data/catalog";
import { track } from "../../lib/analytics";
import { IconClose, IconSparkle, IconCheck } from "../icons";

export default function MuseAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const design = useDesign();
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<{ material: string; reason: string } | null>(null);
  const [thinking, setThinking] = useState(false);

  if (!open) return null;
  if (!design.garment) return null;

  const ask = (text: string) => {
    setGoal(text);
    setThinking(true);
    setResult(null);
    window.setTimeout(() => {
      const rec = museMaterialRecommendation(text, design.garment!, design.fit);
      setResult(rec);
      setThinking(false);
    }, 700);
  };

  const useThis = () => {
    if (!result) return;
    design.setMaterial(result.material as never);
    track("opened_muse", { context: "material", applied: result.material });
    handleClose();
  };

  const handleClose = () => {
    setGoal("");
    setResult(null);
    setThinking(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/30 backdrop-blur-[2px] sm:items-stretch animate-fade-in" onClick={handleClose}>
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-paper p-7 shadow-2xl sm:h-full sm:max-h-none sm:w-[400px] sm:rounded-none sm:rounded-l-3xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory">
              <IconSparkle className="h-4 w-4" />
            </span>
            <p className="font-display text-2xl text-ink">MUSE</p>
          </div>
          <button onClick={handleClose} className="text-ink-soft hover:text-ink">
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <p className="text-sm text-ink-soft">What are you trying to achieve?</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {MUSE_PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => ask(chip)}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                  goal === chip ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goal.trim() && ask(goal)}
              placeholder="Or tell MUSE in your own words..."
              className="flex-1 rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </div>

          {thinking && (
            <div className="mt-6 flex items-center gap-2 text-sm text-ink-faint animate-fade-in">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:300ms]" />
              </span>
              MUSE is thinking
            </div>
          )}

          {result && !thinking && (
            <div className="mt-6 animate-fade-up rounded-2xl border border-clay/30 bg-clay/[0.06] p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-clay-deep">
                <IconSparkle className="h-3.5 w-3.5" /> Recommendation
              </p>
              <p className="mt-2 font-display text-xl text-ink">{materialById(result.material as never).label}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{result.reason}</p>
              <div className="mt-5 flex gap-2">
                <button onClick={useThis} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[12px] uppercase tracking-[0.1em] text-ivory">
                  <IconCheck className="h-3.5 w-3.5" /> Use This
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setGoal("");
                  }}
                  className="flex-1 rounded-full border border-line py-2.5 text-[12px] uppercase tracking-[0.1em] text-ink-soft"
                >
                  See Other Options
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
