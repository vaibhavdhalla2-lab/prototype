import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { IconAlert, IconCopy, IconCheck, IconRefresh } from "./icons";
import EmptyState from "./EmptyState";

export default function MermaidView() {
  const { state } = useApp();
  const actions = useFlowActions();

  if (!state.model) {
    return (
      <div className="relative flex-1 overflow-hidden bg-canvas">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Mermaid</h3>
          <p className="text-xs text-ink-faint">Edit the code directly, then Apply to update the diagram.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={actions.handleCopyMermaid}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconCopy className="h-3.5 w-3.5" /> Copy
          </button>
          <button
            onClick={actions.resetMermaidDraft}
            disabled={!state.mermaidDirty}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2 disabled:opacity-40"
          >
            <IconRefresh className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={actions.applyMermaidEdits}
            disabled={!state.mermaidDirty}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-deep disabled:opacity-40"
          >
            <IconCheck className="h-3.5 w-3.5" /> Apply
          </button>
        </div>
      </div>

      {state.mermaidError && (
        <div className="flex items-start gap-2 border-b border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Unable to update diagram. Mermaid syntax error near line {state.mermaidError.line}.</p>
            <p className="text-xs text-danger/80">{state.mermaidError.message}</p>
            {state.mermaidError.raw && <p className="mt-1 rounded bg-white/60 px-2 py-1 font-mono text-xs">{state.mermaidError.raw}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden p-4">
          <div className="relative h-full overflow-hidden rounded-lg border border-border bg-[#0e1424]">
            <LineNumbers text={state.mermaidDraft} />
            <textarea
              value={state.mermaidDraft}
              onChange={(e) => actions.setMermaidDraft(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 h-full w-full resize-none bg-transparent py-3 pl-12 pr-3 font-mono text-[13px] leading-6 text-[#e5e9f5] outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LineNumbers({ text }: { text: string }) {
  const count = text.split("\n").length;
  return (
    <div className="pointer-events-none absolute left-0 top-0 select-none py-3 pl-3 pr-2 text-right font-mono text-[13px] leading-6 text-[#4b5573]">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}
