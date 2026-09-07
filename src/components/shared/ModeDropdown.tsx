import { useEffect, useRef } from "react";
import type { GenerationMode } from "../../types";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { IconBuild, IconPlan, IconChevronDown, IconCheck } from "../icons";

const OPTIONS: { mode: GenerationMode; label: string; description: string; icon: React.ReactNode }[] = [
  { mode: "build", label: "Build", description: "Create and iterate as you go", icon: <IconBuild className="h-3.5 w-3.5" /> },
  { mode: "plan", label: "Plan", description: "Align on complex work before generating", icon: <IconPlan className="h-3.5 w-3.5" /> },
];

export default function ModeDropdown({
  mode,
  onChange,
  open,
  onOpenChange,
}: {
  mode: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.mode === mode)!;
  useEscapeKey(() => onOpenChange(false), open);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
      >
        {current.icon}
        {current.label}
        <IconChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-40 mb-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-pop">
          {OPTIONS.map((o) => (
            <button
              key={o.mode}
              onClick={() => {
                onChange(o.mode);
                onOpenChange(false);
              }}
              className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-surface-2"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{o.label}</span>
                <span className="block text-[11px] text-ink-faint">{o.description}</span>
              </span>
              {mode === o.mode && <IconCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-deep" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
