import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { track } from "./analytics";
import type { FeedbackFormData } from "./feedbackApi";

export type FeedbackPrefill = Partial<FeedbackFormData>;

interface FeedbackContextValue {
  isOpen: boolean;
  /** Set only for the submission that's about to open — read once, then cleared, by FeedbackWidget. */
  prefill: FeedbackPrefill | null;
  /** Opens the one shared feedback form. Optionally pre-fills answers already known from where it was opened (e.g. a homepage Yes/No prompt) — see FeedbackWidget. */
  open: (prefill?: FeedbackPrefill) => void;
  close: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<FeedbackPrefill | null>(null);
  const open = useCallback((p?: FeedbackPrefill) => {
    setPrefill(p ?? null);
    setIsOpen(true);
    track("feedback_opened");
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, prefill, open, close }), [isOpen, prefill, open, close]);
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
