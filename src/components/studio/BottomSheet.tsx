import { useEffect, type ReactNode } from "react";
import { IconClose } from "../icons";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-x-0 bottom-[64px] z-30 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className="max-h-[56vh] overflow-y-auto rounded-t-[28px] border-t border-line-soft bg-paper px-5 pb-5 pt-3 shadow-[0_-20px_50px_-20px_rgba(26,23,18,0.35)] transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateY(0)" : "translateY(105%)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint">{title}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft" aria-label="Close">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
