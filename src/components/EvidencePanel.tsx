import type { SVGProps } from "react";
import { useApp } from "../lib/store";
import { useEscapeKey } from "../hooks/useEscapeKey";
import type { SourceRef } from "../types";
import { IconX, IconFile, IconMail, IconSlack, IconVideo } from "./icons";

const TYPE_META: Record<SourceRef["type"], { icon: React.ComponentType<SVGProps<SVGSVGElement>>; label: string }> = {
  document: { icon: IconFile, label: "Document" },
  email: { icon: IconMail, label: "Email" },
  slack: { icon: IconSlack, label: "Slack" },
  video: { icon: IconVideo, label: "Video" },
};

const CONFIDENCE_STYLE: Record<SourceRef["confidence"], string> = {
  High: "bg-success-soft text-success",
  Medium: "bg-warn-soft text-warn",
  Low: "bg-danger-soft text-danger",
};

export default function EvidencePanel() {
  const { state, dispatch } = useApp();
  const node = state.model?.nodes.find((n) => n.id === state.evidenceNodeId);
  useEscapeKey(() => dispatch({ type: "SET_EVIDENCE_NODE", id: null }), !!node);
  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 animate-fade-in" onClick={() => dispatch({ type: "SET_EVIDENCE_NODE", id: null })}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface shadow-2xl animate-fade-up"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">Evidence</p>
            <h2 className="text-base font-semibold text-ink">{node.label}</h2>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_EVIDENCE_NODE", id: null })}
            className="grid h-8 w-8 place-items-center rounded-md text-ink-faint hover:bg-surface-2"
          >
            <IconX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-4">
          <p className="text-sm text-ink-soft">
            Why did the AI create this step? Here's what "{node.label}" was derived from.
          </p>

          <div className="rounded-lg border border-border-soft bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Component</p>
            <p className="mt-0.5 text-sm font-medium text-ink">{node.label}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Derived From</p>
            <div className="space-y-3">
              {node.sources.length === 0 && <p className="text-sm text-ink-faint">No sources are linked to this component.</p>}
              {node.sources.map((src) => {
                const meta = TYPE_META[src.type];
                const Icon = meta.icon;
                return (
                  <div key={src.id} className="rounded-lg border border-border-soft bg-surface p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-soft text-brand-deep">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{src.title}</p>
                          <p className="text-[11px] text-ink-faint">
                            {meta.label} · {src.locator}
                          </p>
                        </div>
                      </div>
                      {src.demo && <span className="shrink-0 rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] font-medium text-warn">Demo</span>}
                    </div>
                    <p className="rounded-md bg-surface-2 px-2.5 py-2 text-xs italic text-ink-soft">"{src.excerpt}"</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border-soft bg-surface-2 p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">AI Confidence</p>
            <div className="flex flex-wrap gap-1.5">
              {node.sources.length === 0 ? (
                <span className="text-sm text-ink-faint">N/A</span>
              ) : (
                Array.from(new Set(node.sources.map((s) => s.confidence))).map((c) => (
                  <span key={c} className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLE[c]}`}>
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
