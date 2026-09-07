import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { IconSparkle, IconCheck, IconX } from "./icons";

export default function ModifyPreviewModal() {
  const { state } = useApp();
  const actions = useFlowActions();
  useEscapeKey(actions.rejectModification, !!state.modificationPreview);
  const preview = state.modificationPreview;
  if (!preview) return null;

  const removed = preview.modifiedNodes.length
    ? preview.modifiedNodes.map((m) => m.before)
    : preview.removedNodeIds.map((id) => state.model?.nodes.find((n) => n.id === id)).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl animate-fade-up">
        <div className="border-b border-border px-5 py-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-deep">
            <IconSparkle className="h-3.5 w-3.5" /> AI Proposed Changes
          </p>
          <p className="mt-1 text-sm text-ink-soft">"{preview.instruction}"</p>
        </div>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto scrollbar-none px-5 py-4">
          <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-ink">{preview.summary}</p>

          {removed.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-danger">Removed / Changed From</p>
              <div className="space-y-1.5">
                {removed.map(
                  (n) =>
                    n && (
                      <p key={n.id} className="rounded-md border border-danger/20 bg-danger-soft px-2.5 py-1.5 text-sm text-ink line-through decoration-danger/60">
                        {n.label}
                      </p>
                    ),
                )}
              </div>
            </div>
          )}

          {(preview.addedNodes.length > 0 || preview.modifiedNodes.length > 0) && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">Added / Updated</p>
              <div className="space-y-1.5">
                {preview.addedNodes.map((n) => (
                  <p key={n.id} className="rounded-md border border-success/20 bg-success-soft px-2.5 py-1.5 text-sm text-ink">
                    {n.label}
                  </p>
                ))}
                {preview.modifiedNodes.map((m) => (
                  <p key={m.after.id} className="rounded-md border border-success/20 bg-success-soft px-2.5 py-1.5 text-sm text-ink">
                    {m.after.label}
                    {m.after.actor && m.after.actor !== m.before.actor && <span className="ml-1 text-ink-soft">· Actor: {m.after.actor}</span>}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Connections Updated</p>
            <div className="space-y-1 rounded-lg border border-border-soft bg-surface-2 p-3 text-sm text-ink-soft">
              {connectionsPreview(preview, state).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            onClick={actions.rejectModification}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconX className="h-3.5 w-3.5" /> Reject
          </button>
          <button
            onClick={actions.acceptModification}
            className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-deep"
          >
            <IconCheck className="h-3.5 w-3.5" /> Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function connectionsPreview(
  preview: NonNullable<ReturnType<typeof useApp>["state"]["modificationPreview"]>,
  state: ReturnType<typeof useApp>["state"],
): string[] {
  const nameOf = (id: string) => state.model?.nodes.find((n) => n.id === id)?.label ?? preview.resultModel.nodes.find((n) => n.id === id)?.label ?? id;
  if (preview.edgesAfter.length === 0) return ["No connection changes."];
  return preview.edgesAfter.map((e) => `${nameOf(e.from)} → ${e.label ? `[${e.label}] ` : ""}${nameOf(e.to)}`);
}
