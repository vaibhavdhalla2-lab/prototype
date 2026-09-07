import { useRef, useState } from "react";
import { useApp } from "../../lib/store";
import { useFlowActions } from "../../lib/actions";
import { makeId } from "../../lib/id";
import type { TemplateDefinition, UploadedSourceFile } from "../../types";
import { IconSparkle, IconArrowUp, IconFile, IconVideo, IconX, IconBuild } from "../icons";
import AttachMenu from "../shared/AttachMenu";
import ModeDropdown from "../shared/ModeDropdown";
import TemplateGallery from "../templates/TemplateGallery";
import EnhancePromptCompare from "../EnhancePromptCompare";

const EXAMPLE_PROMPTS: { label: string; text: string }[] = [
  {
    label: "Order-to-Cash",
    text: "Create an Order-to-Cash workflow involving Sales, Finance, Warehouse and SAP.",
  },
  {
    label: "Customer complaint resolution",
    text: "Create an end-to-end customer complaint resolution process involving Customer Support, Operations, Finance and a Customer Service Manager. Include escalation paths, decision points and exception handling.",
  },
  {
    label: "Employee onboarding",
    text: "Create a customer onboarding process starting with account creation, followed by identity verification, welcome setup, and first login confirmation.",
  },
  {
    label: "Incident management",
    text: "Create an incident management process starting with detection and triage, through mitigation, resolution, and a postmortem review.",
  },
  {
    label: "Software deployment",
    text: "Create a software deployment process from pull request through code review, staging deployment, production deployment, and release verification.",
  },
];

function fileTypeFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

export default function LandingScreen() {
  const { state, dispatch, notify } = useApp();
  const actions = useFlowActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit() {
    if (submitting) return;
    if (!state.prompt.trim() && state.uploads.length === 0) {
      notify("Describe a process or add a source before generating.", "error");
      return;
    }
    setSubmitting(true);
    if (state.generationMode === "plan") {
      await actions.handlePlan();
    } else {
      await actions.handleBuildDirect();
    }
    setSubmitting(false);
  }

  function selectTemplate(template: TemplateDefinition) {
    setShowTemplates(false);
    actions.applyTemplate(template);
  }

  const busy = state.enhancing || state.planning || state.building || submitting;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <input
        ref={fileInputRef}
        id="doc-upload-input"
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.csv,.md,.xlsx,video/*"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
          <IconSparkle className="h-6 w-6" />
        </span>
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">Smart Diagram Agent</h1>
        <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">What process would you like to visualize?</p>
      </div>

      <div className="w-full max-w-2xl">
        {state.uploads.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {state.uploads.map((f) => (
              <span key={f.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-2 text-xs text-ink-soft">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-brand-deep">
                  {f.kind === "video" ? <IconVideo className="h-3 w-3" /> : <IconFile className="h-3 w-3" />}
                </span>
                {f.name}
                {f.status === "processing" && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warn" />}
                <button onClick={() => dispatch({ type: "REMOVE_UPLOAD", id: f.id })} className="text-ink-faint hover:text-danger">
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface shadow-xl focus-within:border-brand">
          <textarea
            ref={textareaRef}
            value={state.prompt}
            onChange={(e) => dispatch({ type: "SET_PROMPT", text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe the process, workflow, system or architecture you want to visualize…"
            rows={4}
            className="w-full resize-none rounded-t-2xl bg-transparent px-4 pt-4 pb-2 text-sm text-ink placeholder:text-ink-faint outline-none"
          />
          {state.showEnhanceCompare && state.enhancedPrompt && (
            <div className="px-3">
              <EnhancePromptCompare />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            <AttachMenu
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onUploadClick={() => fileInputRef.current?.click()}
              onTemplateClick={() => setShowTemplates(true)}
            />
            <button
              type="button"
              onClick={actions.handleEnhancePrompt}
              disabled={!state.prompt.trim() || state.enhancing}
              className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-brand-deep hover:bg-brand-soft disabled:opacity-40"
            >
              {state.enhancing ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <IconSparkle className="h-3.5 w-3.5" />
              )}
              Enhance Prompt
            </button>
            <div className="flex-1" />
            <ModeDropdown mode={state.generationMode} onChange={(m) => dispatch({ type: "SET_GENERATION_MODE", mode: m })} open={modeOpen} onOpenChange={setModeOpen} />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || (!state.prompt.trim() && state.uploads.length === 0)}
              title={state.generationMode === "plan" ? "Generate a plan" : "Generate diagram"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition hover:bg-brand-deep disabled:opacity-40"
            >
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <IconArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={actions.loadDemo}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconBuild className="h-3.5 w-3.5" /> Load demo process
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Example prompts</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => dispatch({ type: "SET_PROMPT", text: ex.text })}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-brand hover:text-brand-deep"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showTemplates && <TemplateGallery onClose={() => setShowTemplates(false)} onSelect={selectTemplate} />}
    </div>
  );
}
