import { useRef, useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { makeId } from "../lib/id";
import type { UploadedSourceFile } from "../types";
import { IconUpload, IconFile, IconVideo, IconX, IconChevronLeft, IconSparkle } from "./icons";
import EnhancePromptCompare from "./EnhancePromptCompare";

const EXAMPLE_PROMPTS: { label: string; text: string }[] = [
  {
    label: "Customer onboarding",
    text: "Create a customer onboarding process starting with account creation, followed by identity verification, welcome setup, and first login confirmation.",
  },
  {
    label: "Employee expense approval",
    text: "Create an employee expense approval process from report submission through manager review, finance approval, and reimbursement.",
  },
  {
    label: "Incident management",
    text: "Create an incident management process starting with detection and triage, through mitigation, resolution, and a postmortem review.",
  },
  {
    label: "Software deployment",
    text: "Create a software deployment process from pull request through code review, staging deployment, production deployment, and release verification.",
  },
  {
    label: "Customer refund",
    text: "Create a process diagram for handling a customer refund request. The request is received by customer support, validated against the order, approved by finance, processed through the payment system, and the customer is notified. If the request is rejected, notify the customer with the reason.",
  },
];

const DOC_TYPES = [".pdf", ".docx", ".txt", ".csv", ".md"];

function fileTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "file";
  return ext;
}

export default function InputPanel() {
  const { state, dispatch, notify } = useApp();
  const actions = useFlowActions();
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!state.leftPanelOpen) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-soft hover:bg-surface-2"
          title="Expand input panel"
        >
          <IconChevronLeft className="rotate-180" />
        </button>
      </div>
    );
  }

  function simulateProcessing(file: UploadedSourceFile) {
    setTimeout(
      () => {
        dispatch({ type: "UPDATE_UPLOAD", id: file.id, patch: { status: "ready" } });
        notify(`${file.name} processed.`);
      },
      1200 + Math.random() * 900,
    );
  }

  function addDocuments(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const uploaded: UploadedSourceFile = {
        id: makeId("up"),
        kind: "document",
        name: f.name,
        fileType: fileTypeFromName(f.name),
        size: f.size,
        status: "processing",
        simulated: true,
        addedAt: Date.now(),
      };
      dispatch({ type: "ADD_UPLOAD", file: uploaded });
      simulateProcessing(uploaded);
    });
  }

  function addVideo(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const uploaded: UploadedSourceFile = {
        id: makeId("up"),
        kind: "video",
        name: f.name,
        fileType: fileTypeFromName(f.name),
        size: f.size,
        duration: `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}`,
        status: "processing",
        simulated: true,
        previewUrl: URL.createObjectURL(f),
        addedAt: Date.now(),
      };
      dispatch({ type: "ADD_UPLOAD", file: uploaded });
      simulateProcessing(uploaded);
    });
  }

  const documents = state.uploads.filter((u) => u.kind === "document");
  const videos = state.uploads.filter((u) => u.kind === "video");
  const totalSources = (state.prompt.trim() ? 1 : 0) + state.uploads.length;

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Build your process</h2>
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
          title="Collapse panel"
        >
          <IconChevronLeft />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-6">
        {/* Prompt */}
        <section>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Prompt</label>
          <textarea
            value={state.prompt}
            onChange={(e) => dispatch({ type: "SET_PROMPT", text: e.target.value })}
            placeholder="Describe the process you want to visualize…"
            rows={7}
            className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={actions.handleEnhancePrompt}
              disabled={!state.prompt.trim() || state.enhancing}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-deep hover:text-brand disabled:opacity-40"
            >
              {state.enhancing ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <IconSparkle className="h-3.5 w-3.5" />
              )}
              {state.enhancing ? "Analyzing your prompt…" : "Enhance Prompt"}
            </button>
            {state.activePromptIsEnhanced && <span className="text-[11px] font-medium text-success">Using enhanced version</span>}
          </div>
          {state.showEnhanceCompare && state.enhancedPrompt && <EnhancePromptCompare />}
        </section>

        {/* Documents */}
        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Documents</label>
            <span className="text-[11px] text-ink-faint">{DOC_TYPES.join("  ")}</span>
          </div>
          <input
            ref={docInputRef}
            id="doc-upload-input"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.md"
            className="hidden"
            onChange={(e) => {
              addDocuments(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => docInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addDocuments(e.dataTransfer.files);
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs font-medium text-ink-soft transition ${
              dragOver ? "border-brand bg-brand-soft text-brand-deep" : "border-border hover:border-ink-faint hover:bg-surface-2"
            }`}
          >
            <IconUpload className="h-4 w-4" />
            Click or drop files to upload
          </button>
          {documents.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {documents.map((d) => (
                <SourceCard key={d.id} file={d} />
              ))}
            </ul>
          )}
        </section>

        {/* Video */}
        <section>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Video</label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addVideo(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs font-medium text-ink-soft transition hover:border-ink-faint hover:bg-surface-2"
          >
            <IconVideo className="h-4 w-4" />
            Click or drop a video to upload
          </button>
          {videos.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {videos.map((v) => (
                <SourceCard key={v.id} file={v} />
              ))}
            </ul>
          )}
        </section>

        {/* Context summary */}
        <section className="rounded-lg border border-border-soft bg-surface-2 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Context</h3>
          <div className="space-y-1.5 text-sm">
            <Row label="Prompt" value={state.prompt.trim() ? "1 source" : "None"} />
            <Row label="Documents" value={String(documents.length)} />
            <Row label="Videos" value={String(videos.length)} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border-soft pt-2 text-sm">
            <span className="font-medium text-ink">Total Sources</span>
            <span className="font-semibold text-brand-deep">{totalSources}</span>
          </div>
        </section>

        {/* Example prompts */}
        {!state.model && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Try an example</h3>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => dispatch({ type: "SET_PROMPT", text: ex.text })}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand-deep"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function SourceCard({ file }: { file: UploadedSourceFile }) {
  const { dispatch } = useApp();
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface px-2.5 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
        {file.kind === "video" ? <IconVideo className="h-3.5 w-3.5" /> : <IconFile className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{file.name}</p>
        <p className="flex items-center gap-1 text-[11px] text-ink-faint">
          <span className="uppercase">{file.fileType}</span>
          {file.duration && <span>· {file.duration}</span>}
          <span>·</span>
          {file.status === "processing" ? (
            <span className="flex items-center gap-1 text-warn">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warn" />
              Simulated processing…
            </span>
          ) : (
            <span className="text-success">Ready</span>
          )}
        </p>
      </div>
      <button
        onClick={() => dispatch({ type: "REMOVE_UPLOAD", id: file.id })}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-danger"
        title="Remove"
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
