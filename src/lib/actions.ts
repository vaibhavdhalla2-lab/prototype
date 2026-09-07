import { useApp } from "./store";
import { wait, enhancePrompt, generatePlan, buildModelFromPlan, interpretModification, interpretDiagramModification, generateDocumentation } from "./ai";
import { generateMermaid, parseMermaid, mergeMetadata } from "./mermaid";
import { buildDemoModel, buildDemoUploads, buildDemoComments, DEMO_DOCUMENTATION, DEMO_PROMPT } from "../data/demo";
import { exportDocx, exportMermaidFile, exportPdf, exportPng, copyText } from "./export";
import { makeId } from "./id";
import type { ChatMessage, ProcessNode, ProcessPlan, TemplateDefinition } from "../types";

function chatMsg(role: ChatMessage["role"], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: makeId("msg"), role, content, createdAt: Date.now(), ...extra };
}

const BUILD_STAGE_KEYS = ["analyze", "steps", "decisions", "actors", "diagram", "docs"] as const;

function nextVersionNumber(state: ReturnType<typeof useApp>["state"]): number {
  return Math.min(state.historyIndex + 2, 50);
}

export function useFlowActions() {
  const { state, dispatch, notify } = useApp();

  async function handleEnhancePrompt() {
    if (!state.prompt.trim()) {
      notify("Add a prompt before enhancing it.", "error");
      return;
    }
    dispatch({ type: "SET_ENHANCING", value: true });
    await wait(1000 + Math.random() * 400);
    const enhanced = enhancePrompt(state.prompt);
    dispatch({ type: "SET_ENHANCED_PROMPT", text: enhanced });
  }

  function useEnhancedPrompt() {
    dispatch({ type: "USE_ENHANCED", value: true });
    notify("Using the enhanced prompt.");
  }
  function keepOriginalPrompt() {
    dispatch({ type: "USE_ENHANCED", value: false });
  }
  function closeEnhanceCompare() {
    dispatch({ type: "CLOSE_ENHANCE_COMPARE" });
  }

  function hasContext() {
    return state.prompt.trim().length > 0 || state.uploads.some((u) => u.status === "ready");
  }

  async function handlePlan() {
    if (!hasContext()) {
      notify("Add a prompt or upload a source before planning.", "error");
      return;
    }
    dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("user", state.prompt) });
    dispatch({ type: "SET_PLANNING", value: true });
    await wait(1300 + Math.random() * 400);
    const plan = generatePlan(state.prompt || "General business process");
    dispatch({ type: "SET_PLANNING", value: false });
    dispatch({ type: "SET_PLAN", plan });
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: chatMsg(
        "assistant",
        `I've drafted a ${plan.steps.length}-step plan for "${plan.processTitle}" with ${plan.decisions.length} decision point${plan.decisions.length === 1 ? "" : "s"}. Review it in the panel, then click Build Diagram when you're ready.`,
      ),
    });
  }

  function closePlanModal() {
    dispatch({ type: "SET_SHOW_PLAN_MODAL", value: false });
  }

  function updatePlan(plan: ProcessPlan) {
    dispatch({ type: "UPDATE_PLAN", plan });
  }

  async function runBuildStages(plan: ProcessPlan) {
    dispatch({ type: "RESET_BUILD_STAGES" });
    dispatch({ type: "SET_BUILDING", value: true });
    let model = state.model;
    for (const key of BUILD_STAGE_KEYS) {
      dispatch({ type: "SET_BUILD_STAGE", key, status: "active" });
      await wait(420 + Math.random() * 380);
      dispatch({ type: "SET_BUILD_STAGE", key, status: "done" });
      if (key === "diagram") {
        model = buildModelFromPlan(plan, state.uploads);
        dispatch({ type: "APPLY_MODEL", model, label: "Diagram generated" });
      }
      if (key === "docs" && model) {
        dispatch({ type: "SET_GENERATING_DOCS", value: true });
        await wait(300);
        const text = generateDocumentation(model, plan.processTitle);
        dispatch({ type: "SET_DOCUMENTATION", text });
        dispatch({ type: "SET_GENERATING_DOCS", value: false });
      }
    }
    dispatch({ type: "SET_BUILDING", value: false });
    dispatch({ type: "SET_PROCESS_NAME", name: plan.processTitle });
    const stepCount = model ? model.nodes.filter((n) => n.type !== "start" && n.type !== "end").length : plan.steps.length;
    const decisionCount = model ? model.nodes.filter((n) => n.type === "decision").length : plan.decisions.length;
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: chatMsg(
        "assistant",
        `I've created a ${stepCount}-step process for "${plan.processTitle}" including ${decisionCount} decision point${decisionCount === 1 ? "" : "s"}${plan.exceptions.length ? ` and exception handling for ${plan.exceptions.length} case${plan.exceptions.length === 1 ? "" : "s"}` : ""}.`,
        { versionLabel: `Version ${nextVersionNumber(state)}` },
      ),
    });
    notify("Diagram generated successfully.");
  }

  async function handleBuildDirect() {
    if (!hasContext()) {
      notify("Add a prompt or upload a source before building.", "error");
      return;
    }
    if (!state.model) {
      dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("user", state.prompt) });
    }
    const plan = generatePlan(state.prompt || "General business process");
    await runBuildStages(plan);
  }

  async function handleApprovePlan(plan: ProcessPlan) {
    dispatch({ type: "SET_SHOW_PLAN_MODAL", value: false });
    await runBuildStages(plan);
  }

  function reviseWithAi() {
    if (!state.plan) return;
    const revised: ProcessPlan = {
      ...state.plan,
      gaps: state.plan.gaps.length
        ? state.plan.gaps
        : ["Consider clarifying ownership for any step without a named actor."],
      understanding: state.plan.understanding + " (Revised based on your feedback.)",
    };
    dispatch({ type: "UPDATE_PLAN", plan: revised });
    notify("Plan revised.");
  }

  async function handleModifyRequest(nodeId: string, instruction: string) {
    if (!state.model) return;
    const node = state.model.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dispatch({ type: "SET_MODIFYING", value: true });
    await wait(1000 + Math.random() * 500);
    const preview = interpretModification(node, instruction, state.model);
    dispatch({ type: "SET_MODIFYING", value: false });
    dispatch({ type: "SET_MODIFICATION_PREVIEW", preview });
  }

  async function sendChatMessage(instruction: string) {
    if (!instruction.trim() || !state.model) return;
    const nodeId = state.selectedNodeId ?? undefined;
    dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("user", instruction, { selectedNodeId: nodeId }) });
    dispatch({ type: "SET_MODIFYING", value: true });
    if (nodeId) dispatch({ type: "SET_MODIFYING_NODE", id: nodeId });
    await wait(900 + Math.random() * 500);
    const node = nodeId ? state.model.nodes.find((n) => n.id === nodeId) : undefined;
    const preview = node ? interpretModification(node, instruction, state.model) : interpretDiagramModification(state.model, instruction);
    dispatch({ type: "SET_MODIFYING", value: false });
    dispatch({ type: "SET_MODIFICATION_PREVIEW", preview });
  }

  function acceptModification() {
    if (!state.modificationPreview) return;
    const versionLabel = `Version ${nextVersionNumber(state)}`;
    const summary = state.modificationPreview.summary;
    dispatch({ type: "ACCEPT_MODIFICATION" });
    dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("assistant", summary, { versionLabel }) });
    notify("Component updated by AI.");
  }
  function rejectModification() {
    dispatch({ type: "SET_MODIFICATION_PREVIEW", preview: null });
    dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("assistant", "No problem — I left the diagram as it was.") });
  }

  function applyTemplate(template: TemplateDefinition) {
    dispatch({ type: "SET_PROMPT", text: template.prompt });
    dispatch({ type: "APPLY_MODEL", model: template.model, label: `Template: ${template.name}` });
    dispatch({ type: "SET_PROCESS_NAME", name: template.name });
    const text = generateDocumentation(template.model, template.name);
    dispatch({ type: "SET_DOCUMENTATION", text });
    dispatch({ type: "ADD_CHAT_MESSAGE", message: chatMsg("user", template.prompt) });
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: chatMsg(
        "assistant",
        `Loaded the "${template.name}" template as a starting point. Keep refining it conversationally, or open the Mermaid code to edit it directly.`,
        { versionLabel: "Version 1" },
      ),
    });
    notify(`Loaded "${template.name}" template.`);
  }

  function previewVersion(index: number) {
    dispatch({ type: "SET_HISTORY_INDEX", index });
  }

  function restoreVersion(index: number) {
    const entry = state.history[index];
    if (!entry) return;
    dispatch({ type: "RESTORE_VERSION", index });
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: chatMsg("assistant", `Restored "${entry.label}" as the newest version.`, { versionLabel: `Version ${nextVersionNumber(state)}` }),
    });
    notify("Version restored.");
  }

  function applyMermaidEdits() {
    const res = parseMermaid(state.mermaidDraft);
    if (!res.ok || !res.model) {
      dispatch({ type: "SET_MERMAID_ERROR", error: res.error ?? { line: 1, message: "Unable to parse diagram.", raw: "" } });
      notify("Mermaid syntax error. Your previous valid diagram has been preserved.", "error");
      return;
    }
    const merged = state.model ? mergeMetadata(state.model, res.model) : res.model;
    dispatch({ type: "APPLY_MODEL", model: merged, label: "Mermaid edited", markDocStale: true });
    dispatch({ type: "SET_MERMAID_ERROR", error: null });
    notify("Mermaid changes applied.");
  }
  function resetMermaidDraft() {
    dispatch({ type: "RESET_MERMAID_DRAFT" });
  }
  function setMermaidDraft(text: string) {
    dispatch({ type: "SET_MERMAID_DRAFT", text });
  }

  async function handleGenerateDocs() {
    if (!state.model) {
      notify("Generate a diagram first.", "error");
      return;
    }
    dispatch({ type: "SET_GENERATING_DOCS", value: true });
    await wait(900 + Math.random() * 400);
    const text = generateDocumentation(state.model, state.processName);
    dispatch({ type: "SET_DOCUMENTATION", text });
    dispatch({ type: "SET_GENERATING_DOCS", value: false });
    notify("Documentation updated.");
  }
  function saveDocumentation(text: string) {
    dispatch({ type: "SET_DOCUMENTATION", text, markEdited: true });
  }
  function keepCurrentDocs() {
    dispatch({ type: "SET_DOC_STALE", value: false });
  }

  function updateNodeManually(nodeId: string, patch: Partial<Pick<ProcessNode, "label" | "description" | "actor">>) {
    if (!state.model) return;
    const model = {
      ...state.model,
      nodes: state.model.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    };
    dispatch({ type: "APPLY_MODEL", model, label: "Component edited", markDocStale: true });
    dispatch({ type: "SELECT_NODE", id: nodeId });
    notify("Component updated.");
  }

  function deleteNodeManually(nodeId: string) {
    if (!state.model) return;
    const node = state.model.nodes.find((n) => n.id === nodeId);
    if (!node || node.type === "start" || node.type === "end") {
      notify("Start and end nodes can't be deleted.", "error");
      return;
    }
    const incoming = state.model.edges.filter((e) => e.to === nodeId);
    const outgoing = state.model.edges.filter((e) => e.from === nodeId);
    const edges = state.model.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
    for (const inE of incoming) {
      for (const outE of outgoing) {
        edges.push({ id: `${inE.id}_${outE.id}`, from: inE.from, to: outE.to, label: inE.label ?? outE.label });
      }
    }
    const model = { nodes: state.model.nodes.filter((n) => n.id !== nodeId), edges };
    dispatch({ type: "APPLY_MODEL", model, label: `Deleted "${node.label}"`, markDocStale: true });
    dispatch({ type: "SELECT_NODE", id: null });
    notify(`Deleted "${node.label}".`);
  }

  function deleteEdge(edgeId: string) {
    if (!state.model) return;
    const model = { ...state.model, edges: state.model.edges.filter((e) => e.id !== edgeId) };
    dispatch({ type: "APPLY_MODEL", model, label: "Connection removed", markDocStale: true });
    dispatch({ type: "SELECT_EDGE", id: null });
  }

  function relabelEdge(edgeId: string, label: string) {
    if (!state.model) return;
    const model = { ...state.model, edges: state.model.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)) };
    dispatch({ type: "APPLY_MODEL", model, label: "Connection relabeled", markDocStale: true });
  }

  function loadDemo() {
    const model = buildDemoModel();
    const mermaidText = generateMermaid(model);
    dispatch({
      type: "LOAD_DEMO",
      payload: {
        processName: "Order-to-Cash Process",
        prompt: DEMO_PROMPT,
        enhancedPrompt: null,
        activePromptIsEnhanced: false,
        uploads: buildDemoUploads(),
        plan: null,
        model,
        mermaidText,
        mermaidDraft: mermaidText,
        documentation: DEMO_DOCUMENTATION,
        documentationEdited: false,
        documentationStale: false,
        diagramComments: buildDemoComments(),
        isDemo: true,
        history: [{ label: "Demo process loaded", model, timestamp: Date.now() }],
        historyIndex: 0,
        chat: [
          chatMsg("user", DEMO_PROMPT),
          chatMsg(
            "assistant",
            "I've created an 8-phase process covering order creation, validation, credit check, SAP order, parallel inventory & finance checks, fulfilment with delivery retries, invoicing with a correction loop, and AR & collections — including escalation paths to the Credit Manager, Customer Service Manager and Finance Manager.",
            { versionLabel: "Version 1" },
          ),
        ],
      },
    });
    notify("Demo process loaded.");
  }

  function newProcess() {
    dispatch({ type: "RESET_ALL" });
  }

  async function handleExportPdf() {
    if (!state.model) {
      notify("Generate a diagram before exporting.", "error");
      return;
    }
    const docs = state.documentation ?? generateDocumentation(state.model, state.processName);
    await exportPdf(state.processName, docs);
    notify("Export completed.");
  }
  async function handleExportPng() {
    if (!state.model) {
      notify("Generate a diagram before exporting.", "error");
      return;
    }
    const ok = await exportPng(state.processName);
    notify(ok ? "Diagram exported as PNG." : "Unable to export PNG — try the Diagram view first.", ok ? "default" : "error");
  }
  async function handleExportDocx() {
    if (!state.model) {
      notify("Generate a diagram before exporting.", "error");
      return;
    }
    const docs = state.documentation ?? generateDocumentation(state.model, state.processName);
    await exportDocx(state.processName, docs);
    notify("Export completed.");
  }
  function handleExportMermaid() {
    if (!state.model) {
      notify("Generate a diagram before exporting.", "error");
      return;
    }
    exportMermaidFile(state.mermaidText, state.processName);
    notify("Export completed.");
  }
  async function handleCopyMermaid() {
    const ok = await copyText(state.mermaidText);
    notify(ok ? "Mermaid copied to clipboard." : "Unable to copy — copy manually from the Mermaid view.", ok ? "default" : "error");
  }

  return {
    handleEnhancePrompt,
    useEnhancedPrompt,
    keepOriginalPrompt,
    closeEnhanceCompare,
    handlePlan,
    closePlanModal,
    updatePlan,
    handleApprovePlan,
    handleBuildDirect,
    reviseWithAi,
    handleModifyRequest,
    sendChatMessage,
    acceptModification,
    rejectModification,
    applyTemplate,
    previewVersion,
    restoreVersion,
    updateNodeManually,
    deleteNodeManually,
    deleteEdge,
    relabelEdge,
    applyMermaidEdits,
    resetMermaidDraft,
    setMermaidDraft,
    handleGenerateDocs,
    saveDocumentation,
    keepCurrentDocs,
    loadDemo,
    newProcess,
    handleExportPdf,
    handleExportPng,
    handleExportDocx,
    handleExportMermaid,
    handleCopyMermaid,
  };
}
