import { useApp } from "./store";
import { wait, enhancePrompt, generatePlan, buildModelFromPlan, interpretModification, generateDocumentation } from "./ai";
import { generateMermaid, parseMermaid, mergeMetadata } from "./mermaid";
import { buildDemoModel, buildDemoUploads, buildDemoComments, DEMO_DOCUMENTATION, DEMO_PROMPT } from "../data/demo";
import { exportDocx, exportMermaidFile, exportPdf, copyText } from "./export";
import type { ProcessNode, ProcessPlan } from "../types";

const BUILD_STAGE_KEYS = ["analyze", "steps", "decisions", "actors", "diagram", "docs"] as const;

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
    dispatch({ type: "SET_PLANNING", value: true });
    await wait(1300 + Math.random() * 400);
    const plan = generatePlan(state.prompt || "General business process");
    dispatch({ type: "SET_PLANNING", value: false });
    dispatch({ type: "SET_PLAN", plan });
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
    notify("Diagram generated successfully.");
  }

  async function handleBuildDirect() {
    if (!hasContext()) {
      notify("Add a prompt or upload a source before building.", "error");
      return;
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

  function acceptModification() {
    dispatch({ type: "ACCEPT_MODIFICATION" });
    notify("Component updated by AI.");
  }
  function rejectModification() {
    dispatch({ type: "SET_MODIFICATION_PREVIEW", preview: null });
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
        processName: "Customer Refund Process",
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
    acceptModification,
    rejectModification,
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
    handleExportDocx,
    handleExportMermaid,
    handleCopyMermaid,
  };
}
