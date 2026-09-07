import { useEffect, useRef } from "react";
import { useFlowActions } from "../lib/actions";
import { IconDoc, IconFile, IconMermaid, IconCopy } from "./icons";

export default function ExportMenu({ onClose }: { onClose: () => void }) {
  const actions = useFlowActions();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const item = (icon: React.ReactNode, label: string, sub: string, onClick: () => void) => (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-surface-2"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-faint">{sub}</span>
      </span>
    </button>
  );

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-pop"
    >
      {item(<IconFile />, "Export PDF", "Diagram, documentation & citations", actions.handleExportPdf)}
      {item(<IconDoc />, "Export DOCX", "Purpose, steps, decisions & sources", actions.handleExportDocx)}
      {item(<IconMermaid />, "Export Mermaid", "Download the .mmd source file", actions.handleExportMermaid)}
      <div className="my-1 h-px bg-border" />
      {item(<IconCopy />, "Copy Mermaid", "Copy code to clipboard", actions.handleCopyMermaid)}
    </div>
  );
}
