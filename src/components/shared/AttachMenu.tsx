import { useEffect, useRef } from "react";
import { IconPlus, IconUpload, IconTemplate, IconMermaid, IconDatabase, IconLock } from "../icons";

export default function AttachMenu({
  open,
  onOpenChange,
  onUploadClick,
  onTemplateClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
  onTemplateClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        title="Add context"
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
          open ? "border-brand bg-brand-soft text-brand-deep" : "border-border text-ink-soft hover:bg-surface-2 hover:text-ink"
        }`}
      >
        <IconPlus className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-pop">
          <MenuItem
            icon={<IconUpload className="h-3.5 w-3.5" />}
            label="Upload File"
            sub="PDF, DOCX, TXT, MD, CSV, XLSX"
            onClick={() => {
              onUploadClick();
              onOpenChange(false);
            }}
          />
          <MenuItem
            icon={<IconTemplate className="h-3.5 w-3.5" />}
            label="Choose Template"
            sub="Start from a proven process shape"
            onClick={() => {
              onTemplateClick();
              onOpenChange(false);
            }}
          />
          <div className="my-1 h-px bg-border" />
          <MenuItem icon={<IconMermaid className="h-3.5 w-3.5" />} label="Import Existing Diagram" sub="Coming soon" disabled />
          <MenuItem icon={<IconDatabase className="h-3.5 w-3.5" />} label="Connect Data Source" sub="Coming soon" disabled />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
        {disabled ? <IconLock className="h-3 w-3" /> : icon}
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-faint">{sub}</span>
      </span>
    </button>
  );
}
