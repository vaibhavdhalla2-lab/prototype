import { useState } from "react";
import { track } from "../lib/analytics";
import { IconCheck, IconClose } from "./icons";

interface MicroPromptProps {
  question: string;
  options?: string[];
  eventName: string;
  className?: string;
}

export default function MicroPrompt({ question, options = ["Yes", "Maybe", "No"], eventName, className = "" }: MicroPromptProps) {
  const [answered, setAnswered] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`animate-fade-up rounded-2xl border border-line-soft bg-paper px-5 py-4 shadow-[0_4px_20px_-14px_rgba(26,23,18,0.4)] ${className}`}>
      {!answered ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink">{question}</p>
          <div className="flex items-center gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswered(opt);
                  track("micro_feedback", { question, answer: opt, eventName });
                }}
                className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {opt}
              </button>
            ))}
            <button onClick={() => setDismissed(true)} className="text-ink-faint hover:text-ink-soft" aria-label="Dismiss">
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <IconCheck className="h-4 w-4 text-clay" />
          Thanks — noted.
        </div>
      )}
    </div>
  );
}
