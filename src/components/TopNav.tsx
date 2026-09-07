import { useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import {
  IconSparkle,
  IconPlan,
  IconBuild,
  IconUndo,
  IconRedo,
  IconComment,
  IconDoc,
  IconMermaid,
  IconExport,
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
      </div>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        <NavButton icon={<IconSparkle />} label="Enhance Prompt" onClick={actions.handleEnhancePrompt} disabled={state.enhancing || !state.prompt.trim()} loading={state.enhancing} />
        <NavButton icon={<IconPlan />} label="Plan" onClick={actions.handlePlan} disabled={state.planning || state.building} loading={state.planning} />
        <NavButton icon={<IconBuild />} label="Build" onClick={actions.handleBuildDirect} disabled={state.building || state.planning} loading={state.building} primary />
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
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: "documentation" })}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-surface-2 ${state.view === "documentation" ? "bg-surface-2 text-ink" : "text-ink-soft"}`}
          title="Documentation"
        >
          <IconDoc />
          <span className="hidden lg:inline">Documentation</span>
        </button>
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: state.view === "mermaid" ? "diagram" : "mermaid" })}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-surface-2 ${state.view === "mermaid" ? "bg-surface-2 text-ink" : "text-ink-soft"}`}
          title="Mermaid"
        >
          <IconMermaid />
          <span className="hidden lg:inline">Mermaid</span>
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

function NavButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? "bg-brand text-white hover:bg-brand-deep" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      <span>{label}</span>
      {loading && <IconCheck className="hidden" />}
    </button>
  );
}
