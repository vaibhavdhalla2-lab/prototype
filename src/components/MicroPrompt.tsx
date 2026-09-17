import { useState } from "react";
import { track } from "../lib/analytics";
import { IconCheck, IconClose } from "./icons";

interface MicroPromptProps {
  question: string;
  options?: string[];
  eventName: string;
  className?: string;
  /** Recolors for use on a dark (void-theme) background instead of the light editorial theme. */
  dark?: boolean;
}

export default function MicroPrompt({ question, options = ["Yes", "Maybe", "No"], eventName, className = "", dark = false }: MicroPromptProps) {
  const [answered, setAnswered] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`animate-fade-up rounded-2xl border px-5 py-4 ${
        dark ? "border-white/10 bg-white/[0.04] shadow-none backdrop-blur-xl" : "border-line-soft bg-paper shadow-[0_4px_20px_-14px_rgba(26,23,18,0.4)]"
      } ${className}`}
    >
      {!answered ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${dark ? "text-ivory/80" : "text-ink"}`}>{question}</p>
          <div className="flex items-center gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswered(opt);
                  track("micro_feedback", { question, answer: opt, eventName });
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                  dark ? "border-white/15 text-ivory/60 hover:border-ivory/40 hover:text-ivory" : "border-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {opt}
              </button>
            ))}
            <button onClick={() => setDismissed(true)} className={dark ? "text-ivory/30 hover:text-ivory/60" : "text-ink-faint hover:text-ink-soft"} aria-label="Dismiss">
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-2 text-sm ${dark ? "text-ivory/70" : "text-ink-soft"}`}>
          <IconCheck className={`h-4 w-4 ${dark ? "text-lime" : "text-clay"}`} />
          Thanks — noted.
        </div>
      )}
    </div>
  );
}
