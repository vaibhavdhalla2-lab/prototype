import { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { useEscapeKey } from "../hooks/useEscapeKey";
import {
  IconUndo,
  IconRedo,
  IconComment,
  IconDoc,
  IconMermaid,
  IconExport,
  IconChevronDown,
  IconClock,
  IconRestore,
  IconCheck,
} from "./icons";
import ExportMenu from "./ExportMenu";

export default function TopNav() {
  const { state, dispatch } = useApp();
  const actions = useFlowActions();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.processName);
  const [exportOpen, setExportOpen] = useState(false);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  function commitName() {
    const name = nameDraft.trim() || "Untitled Process";
    dispatch({ type: "SET_PROCESS_NAME", name });
    setEditingName(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => {
            if (confirm("Start a new process? This clears the current diagram from view (your saved data stays until you reload).")) {
              actions.newProcess();
            }
          }}
          className="flex items-center gap-2 shrink-0"
          title="FlowBuilder AI — start a new process"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 5h8a3 3 0 010 6h-4v8" />
              <circle cx="18" cy="17" r="2.4" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight text-ink">FlowBuilder AI</span>
        </button>
        <div className="h-5 w-px bg-border shrink-0" />
        <div className="min-w-0 flex items-center gap-2">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameDraft(state.processName);
                  setEditingName(false);
                }
              }}
              className="min-w-0 max-w-[220px] rounded-md border border-brand px-2 py-1 text-sm font-medium text-ink outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setNameDraft(state.processName);
                setEditingName(true);
              }}
              className="truncate max-w-[220px] rounded-md px-1.5 py-1 text-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
              title="Rename process"
            >
              {state.processName}
            </button>
          )}
          <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-faint sm:flex">
            {state.savedStatus === "saved" ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Saved
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse-soft" /> Saving…
              </>
            )}
          </span>
        </div>
        <VersionDropdown />
      </div>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "diagram" })}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              state.view === "diagram" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Diagram
          </button>
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "mermaid" })}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              state.view === "mermaid" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <IconMermaid className="h-3.5 w-3.5" /> Code
          </button>
        </div>
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: "documentation" })}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-surface-2 ${state.view === "documentation" ? "bg-surface-2 text-ink" : "text-ink-soft"}`}
          title="Documentation"
        >
          <IconDoc />
          <span className="hidden lg:inline">Documentation</span>
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={!canUndo}
          title="Undo (Ctrl/Cmd+Z)"
          className="grid h-8 w-8 place-items-center rounded-md text-ink-soft hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IconUndo />
        </button>
        <button
          onClick={() => dispatch({ type: "REDO" })}
          disabled={!canRedo}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          className="grid h-8 w-8 place-items-center rounded-md text-ink-soft hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IconRedo />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => {
            dispatch({ type: "SET_RIGHT_PANEL_MODE", mode: "comments" });
            dispatch({ type: "SET_COMMENTS_TARGET", target: { scope: "diagram" } });
          }}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-2"
          title="Comments"
        >
          <IconComment />
          <span className="hidden lg:inline">Comments</span>
          {(() => {
            const total = state.diagramComments.length + (state.model?.nodes.reduce((s, n) => s + n.comments.length, 0) ?? 0);
            return total > 0 ? (
              <span className="rounded-full bg-brand-soft px-1.5 text-xs font-semibold text-brand-deep">{total}</span>
            ) : null;
          })()}
        </button>
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
            title="Export"
          >
            <IconExport />
            <span className="hidden lg:inline">Export</span>
          </button>
          {exportOpen && <ExportMenu onClose={() => setExportOpen(false)} />}
        </div>
      </div>
    </header>
  );
}

function VersionDropdown() {
  const { state } = useApp();
  const actions = useFlowActions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (state.history.length === 0) return null;
  const current = state.historyIndex + 1;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-ink-soft hover:bg-surface-2"
      >
        Version {current} <IconChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-pop">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Version History</p>
          <div className="max-h-72 space-y-0.5 overflow-y-auto scrollbar-none">
            {state.history
              .map((h, i) => ({ ...h, i }))
              .slice()
              .reverse()
              .map(({ label, timestamp, i }) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${i === state.historyIndex ? "bg-brand-soft" : "hover:bg-surface-2"}`}
                >
                  <button onClick={() => actions.previewVersion(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${i === state.historyIndex ? "bg-brand text-white" : "bg-surface-2 text-ink-soft"}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ink">{label}</span>
                      <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                        <IconClock className="h-2.5 w-2.5" /> {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    </span>
                  </button>
                  {i === state.historyIndex ? (
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-brand-deep" />
                  ) : (
                    <button
                      onClick={() => {
                        actions.restoreVersion(i);
                        setOpen(false);
                      }}
                      title="Restore this version"
                      className="shrink-0 rounded p-1 text-ink-faint hover:bg-surface hover:text-brand-deep"
                    >
                      <IconRestore className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
