import { useState } from "react";
import { track } from "../lib/analytics";
import { IconCheck, IconClose } from "./icons";

interface MicroPromptProps {
  question: string;
  options?: string[];
  eventName: string;
  className?: string;
  /** Recolors for use over the home page's deep-plum "creation studio" section instead of the light editorial theme. */
  dark?: boolean;
  /** Called with the picked option in addition to the default local "noted" state — e.g. to open the full feedback form with this answer carried in. */
  onAnswer?: (answer: string) => void;
}

export default function MicroPrompt({ question, options = ["Yes", "Maybe", "No"], eventName, className = "", dark = false, onAnswer }: MicroPromptProps) {
  const [answered, setAnswered] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`animate-fade-up rounded-2xl border px-5 py-4 ${
        dark ? "glass-plum border-white/10 shadow-none" : "border-line-soft bg-paper shadow-[0_4px_20px_-14px_rgba(26,23,18,0.4)]"
      } ${className}`}
    >
      {!answered ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${dark ? "text-[#faf4ea]/85" : "text-ink"}`}>{question}</p>
          <div className="flex items-center gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswered(opt);
                  track("micro_feedback", { question, answer: opt, eventName });
                  onAnswer?.(opt);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                  dark
                    ? "border-white/15 text-[#faf4ea]/60 hover:border-[#d4af70]/50 hover:text-[#faf4ea]"
                    : "border-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {opt}
              </button>
            ))}
            <button onClick={() => setDismissed(true)} className={dark ? "text-[#faf4ea]/30 hover:text-[#faf4ea]/60" : "text-ink-faint hover:text-ink-soft"} aria-label="Dismiss">
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-2 text-sm ${dark ? "text-[#faf4ea]/70" : "text-ink-soft"}`}>
          <IconCheck className={`h-4 w-4 ${dark ? "text-[#d4af70]" : "text-clay"}`} />
          Thanks — noted.
        </div>
      )}
    </div>
  );
}
