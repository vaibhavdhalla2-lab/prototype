import { useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { IconEdit } from "./icons";

export default function EnhancePromptCompare() {
  const { state, dispatch } = useApp();
  const actions = useFlowActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.enhancedPrompt ?? "");

  if (!state.enhancedPrompt) return null;

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-surface-2 p-3 animate-fade-up">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Original Prompt</p>
        <p className="rounded-md border border-border-soft bg-surface px-2.5 py-2 text-xs text-ink-soft">{state.prompt}</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-deep">Enhanced Prompt</p>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-md border border-brand bg-surface px-2.5 py-2 text-xs text-ink outline-none"
          />
        ) : (
          <p className="rounded-md border border-brand/30 bg-brand-soft px-2.5 py-2 text-xs text-ink">{state.enhancedPrompt}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {editing ? (
          <button
            onClick={() => {
              dispatch({ type: "SET_ENHANCED_PROMPT", text: draft });
              setEditing(false);
            }}
            className="rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-deep"
          >
            Save Edit
          </button>
        ) : (
          <>
            <button
              onClick={actions.useEnhancedPrompt}
              className="rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-deep"
            >
              Use Enhanced Prompt
            </button>
            <button
              onClick={actions.keepOriginalPrompt}
              className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
            >
              Keep Original
            </button>
            <button
              onClick={() => {
                setDraft(state.enhancedPrompt ?? "");
                setEditing(true);
              }}
              className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
            >
              <IconEdit className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={actions.closeEnhanceCompare}
              className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-faint hover:text-ink"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}
