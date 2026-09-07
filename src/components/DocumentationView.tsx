import { useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { IconEdit, IconCheck, IconRefresh, IconCopy, IconAlert } from "./icons";
import { copyText } from "../lib/export";

export default function DocumentationView() {
  const { state, notify } = useApp();
  const actions = useFlowActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.documentation ?? "");

  if (!state.model) {
    return (
      <div className="flex-1 overflow-y-auto bg-canvas p-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-ink-soft">Generate a diagram first — documentation is created automatically once your process exists.</p>
        </div>
      </div>
    );
  }

  if (state.generatingDocs && !state.documentation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-sm font-medium text-ink">Generating process documentation…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Documentation</h3>
          <p className="text-xs text-ink-faint">Process SOP generated from the current diagram.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={async () => {
              const ok = await copyText(state.documentation ?? "");
              notify(ok ? "Documentation copied." : "Unable to copy.", ok ? "default" : "error");
            }}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconCopy className="h-3.5 w-3.5" /> Copy
          </button>
          <button
            onClick={actions.handleGenerateDocs}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconRefresh className="h-3.5 w-3.5" /> Regenerate
          </button>
          {editing ? (
            <button
              onClick={() => {
                actions.saveDocumentation(draft);
                setEditing(false);
              }}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-deep"
            >
              <IconCheck className="h-3.5 w-3.5" /> Save
            </button>
          ) : (
            <button
              onClick={() => {
                setDraft(state.documentation ?? "");
                setEditing(true);
              }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
            >
              <IconEdit className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      {state.documentationStale && (
        <div className="flex items-center justify-between gap-3 border-b border-warn/30 bg-warn-soft px-4 py-2.5 text-sm text-warn">
          <span className="flex items-center gap-2">
            <IconAlert className="h-4 w-4 shrink-0" /> The process diagram has changed. Would you like to update the documentation?
          </span>
          <span className="flex shrink-0 gap-2">
            <button onClick={actions.handleGenerateDocs} className="rounded-md bg-warn px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">
              Update Documentation
            </button>
            <button onClick={actions.keepCurrentDocs} className="rounded-md border border-warn/40 px-2.5 py-1 text-xs font-medium text-warn hover:bg-warn/10">
              Keep Current
            </button>
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-[70vh] w-full resize-none rounded-lg border border-brand bg-surface px-4 py-3 font-mono text-sm text-ink outline-none"
            />
          ) : (
            <article className="rounded-xl border border-border bg-surface px-8 py-8 shadow-sm">
              <MarkdownBody text={state.documentation ?? ""} />
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

function MarkdownBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered: string[][] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {list.map((l, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inline(l) }} />
          ))}
        </ul>,
      );
      list = [];
    }
    if (ordered.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
          {ordered.map((itemLines, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: itemLines.map(inline).join("<br/>") }} />
          ))}
        </ol>,
      );
      ordered = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={idx} className="mb-3 text-2xl font-bold text-ink">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={idx} className="mb-2 mt-6 border-t border-border-soft pt-5 text-base font-semibold text-ink first:mt-0 first:border-0 first:pt-0">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={idx} className="mb-1 mt-3 text-sm font-semibold text-ink" dangerouslySetInnerHTML={{ __html: inline(line.slice(4)) }} />,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      ordered.push([line.replace(/^\s*\d+\.\s+/, "")]);
    } else if (ordered.length && /^\s{2,}\S/.test(raw)) {
      ordered[ordered.length - 1].push(line.trim());
    } else {
      flushList();
      blocks.push(<p key={idx} className="my-2 text-sm leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  });
  flushList();

  return <>{blocks}</>;
}

function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}
