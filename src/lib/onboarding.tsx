import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { track } from "./analytics";

const STORAGE_KEY = "forme_onboarded_v1";

interface OnboardingContextValue {
  isOpen: boolean;
  hasOnboarded: boolean;
  open: () => void;
  close: () => void;
  complete: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function readHasOnboarded() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(readHasOnboarded);
  const [isOpen, setIsOpen] = useState(() => !readHasOnboarded());

  const open = useCallback(() => {
    setIsOpen(true);
    track("landing_view", { onboarding: "replay" });
  }, []);

  const markOnboarded = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors in prototype
    }
    setHasOnboarded(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    markOnboarded();
  }, [markOnboarded]);

  const complete = useCallback(() => {
    setIsOpen(false);
    markOnboarded();
  }, [markOnboarded]);

  const value = useMemo(() => ({ isOpen, hasOnboarded, open, close, complete }), [isOpen, hasOnboarded, open, close, complete]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
