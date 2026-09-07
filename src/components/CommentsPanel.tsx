import { useState } from "react";
import { useApp } from "../lib/store";
import type { CommentReply, CommentThread } from "../types";
import { IconCheck, IconTrash } from "./icons";

const CURRENT_USER = "You";

export default function CommentsPanel() {
  const { state, dispatch } = useApp();
  const target = state.commentsTarget ?? { scope: "diagram" as const };
  const node = target.scope === "node" ? state.model?.nodes.find((n) => n.id === target.nodeId) : null;

  const threads: CommentThread[] = target.scope === "diagram" ? state.diagramComments : (node?.comments ?? []);

  function addComment(text: string) {
    if (!text.trim()) return;
    if (target.scope === "diagram") {
      dispatch({ type: "ADD_DIAGRAM_COMMENT", text: text.trim(), author: CURRENT_USER });
    } else {
      dispatch({ type: "ADD_NODE_COMMENT", nodeId: target.nodeId, text: text.trim(), author: CURRENT_USER });
    }
  }
  function reply(commentId: string, text: string) {
    if (!text.trim()) return;
    if (target.scope === "diagram") {
      dispatch({ type: "REPLY_DIAGRAM_COMMENT", commentId, text: text.trim(), author: CURRENT_USER });
    } else {
      dispatch({ type: "REPLY_NODE_COMMENT", nodeId: target.nodeId, commentId, text: text.trim(), author: CURRENT_USER });
    }
  }
  function resolve(commentId: string) {
    if (target.scope === "diagram") dispatch({ type: "RESOLVE_DIAGRAM_COMMENT", commentId });
    else dispatch({ type: "RESOLVE_NODE_COMMENT", nodeId: target.nodeId, commentId });
  }
  function del(commentId: string) {
    if (target.scope === "diagram") dispatch({ type: "DELETE_DIAGRAM_COMMENT", commentId });
    else dispatch({ type: "DELETE_NODE_COMMENT", nodeId: target.nodeId, commentId });
  }

  const [draft, setDraft] = useState("");

  const otherComponents = state.model?.nodes.filter((n) => n.comments.length > 0 && n.id !== (target.scope === "node" ? target.nodeId : "")) ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-soft p-4">
        <div className="mb-2 flex gap-1.5">
          <button
            onClick={() => dispatch({ type: "SET_COMMENTS_TARGET", target: { scope: "diagram" } })}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${target.scope === "diagram" ? "bg-brand text-white" : "bg-surface-2 text-ink-soft hover:bg-border-soft"}`}
          >
            Diagram
          </button>
          {node && (
            <button className="rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white">{node.label}</button>
          )}
        </div>
        <h3 className="text-sm font-semibold text-ink">{target.scope === "diagram" ? "Diagram Comments" : `Comments on "${node?.label ?? ""}"`}</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3">
        {threads.length === 0 && <p className="text-sm text-ink-faint">No comments yet. Start the discussion below.</p>}
        {threads.map((t) => (
          <Thread key={t.id} thread={t} onReply={(text) => reply(t.id, text)} onResolve={() => resolve(t.id)} onDelete={() => del(t.id)} />
        ))}

        {target.scope === "diagram" && otherComponents.length > 0 && (
          <div className="mt-4 border-t border-border-soft pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Component discussions</p>
            <div className="space-y-1">
              {otherComponents.map((n) => (
                <button
                  key={n.id}
                  onClick={() => dispatch({ type: "SET_COMMENTS_TARGET", target: { scope: "node", nodeId: n.id } })}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-surface-2"
                >
                  <span className="truncate">{n.label}</span>
                  <span className="font-semibold text-ink-faint">{n.comments.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border-soft p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-surface-2 px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:bg-surface"
        />
        <button
          onClick={() => {
            addComment(draft);
            setDraft("");
          }}
          disabled={!draft.trim()}
          className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-deep disabled:opacity-50"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}

function Thread({
  thread,
  onReply,
  onResolve,
  onDelete,
}: {
  thread: CommentThread;
  onReply: (text: string) => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const [replyDraft, setReplyDraft] = useState("");
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={`rounded-lg border p-3 ${thread.resolved ? "border-border-soft bg-surface-2 opacity-70" : "border-border-soft bg-surface"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{thread.author}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{thread.text}</p>
        </div>
        {thread.resolved && <span className="shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">Resolved</span>}
      </div>

      {thread.replies.length > 0 && (
        <div className="mt-2 space-y-1.5 border-l-2 border-border-soft pl-3">
          {thread.replies.map((r: CommentReply) => (
            <div key={r.id}>
              <p className="text-xs font-medium text-ink">{r.author}</p>
              <p className="text-xs text-ink-soft">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-2 flex gap-1.5">
          <input
            autoFocus
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && replyDraft.trim()) {
                onReply(replyDraft);
                setReplyDraft("");
                setShowReply(false);
              }
            }}
            placeholder="Reply…"
            className="min-w-0 flex-1 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-brand"
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs font-medium text-ink-faint">
        <button onClick={() => setShowReply((v) => !v)} className="hover:text-ink">
          Reply
        </button>
        <button onClick={onResolve} className="flex items-center gap-1 hover:text-success">
          <IconCheck className="h-3 w-3" /> {thread.resolved ? "Reopen" : "Resolve"}
        </button>
        {thread.author === "You" && (
          <button onClick={onDelete} className="flex items-center gap-1 hover:text-danger">
            <IconTrash className="h-3 w-3" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
