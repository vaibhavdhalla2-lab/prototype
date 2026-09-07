import { useEffect, useRef, useState } from "react";
import { useApp } from "../../lib/store";
import { useFlowActions } from "../../lib/actions";
import { makeId } from "../../lib/id";
import type { ChatMessage, TemplateDefinition, UploadedSourceFile } from "../../types";
import { IconSparkle, IconArrowUp, IconX, IconChevronLeft, IconFile, IconVideo } from "../icons";
import AttachMenu from "../shared/AttachMenu";
import TemplateGallery from "../templates/TemplateGallery";

function fileTypeFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ChatPanel() {
  const { state, dispatch, notify } = useApp();
  const actions = useFlowActions();
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = state.modifying || state.building || state.planning;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.chat.length, busy]);

  if (!state.leftPanelOpen) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-soft hover:bg-surface-2"
          title="Expand chat panel"
        >
          <IconChevronLeft className="rotate-180" />
        </button>
      </div>
    );
  }

  const selectedNode = state.selectedNodeId ? state.model?.nodes.find((n) => n.id === state.selectedNodeId) : null;

  function addFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const isVideo = f.type.startsWith("video/");
      const uploaded: UploadedSourceFile = {
        id: makeId("up"),
        kind: isVideo ? "video" : "document",
        name: f.name,
        fileType: fileTypeFromName(f.name),
        size: f.size,
        status: "processing",
        simulated: true,
        previewUrl: isVideo ? URL.createObjectURL(f) : undefined,
        addedAt: Date.now(),
      };
      dispatch({ type: "ADD_UPLOAD", file: uploaded });
      setTimeout(
        () => {
          dispatch({ type: "UPDATE_UPLOAD", id: uploaded.id, patch: { status: "ready" } });
          notify(`${uploaded.name} processed.`);
        },
        1000 + Math.random() * 900,
      );
    });
  }

  function selectTemplate(template: TemplateDefinition) {
    setShowTemplates(false);
    if (state.model && !confirm(`Replace the current diagram with the "${template.name}" template? This starts a new version.`)) return;
    actions.applyTemplate(template);
  }

  function submit() {
    if (!draft.trim() || busy) return;
    actions.sendChatMessage(draft.trim());
    setDraft("");
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-surface">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.csv,.md,.xlsx,video/*"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">AI Conversation</h2>
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
          title="Collapse panel"
        >
          <IconChevronLeft />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-4">
        {state.chat.length === 0 && (
          <p className="text-sm text-ink-faint">Ask for changes to your diagram here — e.g. "Add a Finance approval after the credit check."</p>
        )}
        {state.chat.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            {state.building ? "Building your diagram…" : state.planning ? "Drafting a plan…" : "Updating the diagram…"}
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-1.5">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-brand-deep">
            <IconSparkle className="h-3 w-3 shrink-0" /> Selected: <span className="truncate">{selectedNode.label}</span>
          </span>
          <button onClick={() => dispatch({ type: "SELECT_NODE", id: null })} className="shrink-0 text-brand-deep hover:opacity-70">
            <IconX className="h-3 w-3" />
          </button>
        </div>
      )}

      {state.uploads.length > 0 && (
        <div className="mx-4 mb-2 flex flex-wrap gap-1.5">
          {state.uploads.map((f) => (
            <span key={f.id} className="flex items-center gap-1 rounded-full border border-border bg-surface-2 py-0.5 pl-1 pr-1.5 text-[11px] text-ink-soft">
              {f.kind === "video" ? <IconVideo className="h-3 w-3" /> : <IconFile className="h-3 w-3" />}
              <span className="max-w-[100px] truncate">{f.name}</span>
              <button onClick={() => dispatch({ type: "REMOVE_UPLOAD", id: f.id })} className="text-ink-faint hover:text-danger">
                <IconX className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-border-soft p-3">
        <div className="rounded-xl border border-border bg-surface-2 focus-within:border-brand">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask for changes…"
            rows={2}
            className="w-full resize-none rounded-t-xl bg-transparent px-3 pt-2.5 pb-1 text-sm text-ink placeholder:text-ink-faint outline-none"
          />
          <div className="flex items-center gap-2 px-2 pb-2">
            <AttachMenu
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onUploadClick={() => fileInputRef.current?.click()}
              onTemplateClick={() => setShowTemplates(true)}
            />
            <div className="flex-1" />
            <button
              onClick={submit}
              disabled={busy || !draft.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition hover:bg-brand-deep disabled:opacity-40"
              title="Send"
            >
              <IconArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showTemplates && <TemplateGallery onClose={() => setShowTemplates(false)} onSelect={selectTemplate} />}
    </aside>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { dispatch, state } = useApp();
  const isUser = message.role === "user";

  function jumpToVersion() {
    const m = message.versionLabel?.match(/Version (\d+)/);
    if (!m) return;
    const idx = Number(m[1]) - 1;
    if (idx >= 0 && idx < state.history.length) dispatch({ type: "SET_HISTORY_INDEX", index: idx });
  }

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{isUser ? "You" : "Agent"}</span>
      <div
        className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
          isUser ? "bg-brand text-white" : "border border-border-soft bg-surface-2 text-ink"
        }`}
      >
        {message.content}
      </div>
      <div className="flex items-center gap-2">
        {message.versionLabel && (
          <button
            onClick={jumpToVersion}
            className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-soft hover:border-brand hover:text-brand-deep"
          >
            {message.versionLabel}
          </button>
        )}
        <span className="text-[10px] text-ink-faint">{timeAgo(message.createdAt)}</span>
      </div>
    </div>
  );
}
