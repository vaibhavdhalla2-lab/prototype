import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type {
  AppView,
  CommentReply,
  CommentThread,
  DiagramComment,
  ModificationPreview,
  ProcessModel,
  ProcessPlan,
  RightPanelMode,
  UploadedSourceFile,
} from "../types";
import { generateMermaid, parseMermaid, type MermaidParseError, mergeMetadata } from "./mermaid";
import { makeId } from "./id";
import { generateDocumentation } from "./ai";

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "error";
}

export interface HistoryEntry {
  label: string;
  model: ProcessModel;
  timestamp: number;
}

export type BuildStageStatus = "pending" | "active" | "done";
export interface BuildStage {
  key: string;
  label: string;
  status: BuildStageStatus;
}

export interface AppState {
  processName: string;
  savedStatus: "saved" | "saving";
  prompt: string;
  enhancedPrompt: string | null;
  activePromptIsEnhanced: boolean;
  showEnhanceCompare: boolean;
  enhancing: boolean;
  uploads: UploadedSourceFile[];

  planning: boolean;
  plan: ProcessPlan | null;
  showPlanModal: boolean;

  building: boolean;
  buildStages: BuildStage[];

  model: ProcessModel | null;
  mermaidText: string;
  mermaidDraft: string;
  mermaidError: MermaidParseError | null;
  mermaidDirty: boolean;

  documentation: string | null;
  documentationEdited: boolean;
  documentationStale: boolean;
  generatingDocs: boolean;

  diagramComments: DiagramComment[];

  history: HistoryEntry[];
  historyIndex: number;

  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  view: AppView;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelMode: RightPanelMode;

  zoom: number;
  pan: { x: number; y: number };

  toasts: Toast[];
  isDemo: boolean;

  evidenceNodeId: string | null;
  commentsTarget: { scope: "diagram" } | { scope: "node"; nodeId: string } | null;

  modifyingNodeId: string | null;
  modifying: boolean;
  modificationPreview: ModificationPreview | null;

  hydrated: boolean;
}

const emptyBuildStages = (): BuildStage[] => [
  { key: "analyze", label: "Analyzing context", status: "pending" },
  { key: "steps", label: "Identifying process steps", status: "pending" },
  { key: "decisions", label: "Identifying decisions", status: "pending" },
  { key: "actors", label: "Identifying actors", status: "pending" },
  { key: "diagram", label: "Generating diagram", status: "pending" },
  { key: "docs", label: "Generating documentation", status: "pending" },
];

function initialState(): AppState {
  return {
    processName: "Untitled Process",
    savedStatus: "saved",
    prompt: "",
    enhancedPrompt: null,
    activePromptIsEnhanced: false,
    showEnhanceCompare: false,
    enhancing: false,
    uploads: [],

    planning: false,
    plan: null,
    showPlanModal: false,

    building: false,
    buildStages: emptyBuildStages(),

    model: null,
    mermaidText: "",
    mermaidDraft: "",
    mermaidError: null,
    mermaidDirty: false,

    documentation: null,
    documentationEdited: false,
    documentationStale: false,
    generatingDocs: false,

    diagramComments: [],

    history: [],
    historyIndex: -1,

    selectedNodeId: null,
    selectedEdgeId: null,
    view: "diagram",
    leftPanelOpen: true,
    rightPanelOpen: true,
    rightPanelMode: "inspector",

    zoom: 1,
    pan: { x: 0, y: 0 },

    toasts: [],
    isDemo: false,

    evidenceNodeId: null,
    commentsTarget: null,

    modifyingNodeId: null,
    modifying: false,
    modificationPreview: null,

    hydrated: false,
  };
}

export type Action =
  | { type: "SET_PROMPT"; text: string }
  | { type: "SET_PROCESS_NAME"; name: string }
  | { type: "SET_ENHANCING"; value: boolean }
  | { type: "SET_ENHANCED_PROMPT"; text: string }
  | { type: "USE_ENHANCED"; value: boolean }
  | { type: "CLOSE_ENHANCE_COMPARE" }
  | { type: "ADD_UPLOAD"; file: UploadedSourceFile }
  | { type: "UPDATE_UPLOAD"; id: string; patch: Partial<UploadedSourceFile> }
  | { type: "REMOVE_UPLOAD"; id: string }
  | { type: "SET_PLANNING"; value: boolean }
  | { type: "SET_PLAN"; plan: ProcessPlan | null }
  | { type: "UPDATE_PLAN"; plan: ProcessPlan }
  | { type: "SET_SHOW_PLAN_MODAL"; value: boolean }
  | { type: "SET_BUILDING"; value: boolean }
  | { type: "SET_BUILD_STAGE"; key: string; status: BuildStageStatus }
  | { type: "RESET_BUILD_STAGES" }
  | { type: "APPLY_MODEL"; model: ProcessModel; label: string; markDocStale?: boolean }
  | { type: "SET_MERMAID_DRAFT"; text: string }
  | { type: "SET_MERMAID_ERROR"; error: MermaidParseError | null }
  | { type: "RESET_MERMAID_DRAFT" }
  | { type: "SET_DOCUMENTATION"; text: string; markEdited?: boolean }
  | { type: "SET_DOC_STALE"; value: boolean }
  | { type: "SET_GENERATING_DOCS"; value: boolean }
  | { type: "ADD_DIAGRAM_COMMENT"; text: string; author: string }
  | { type: "REPLY_DIAGRAM_COMMENT"; commentId: string; text: string; author: string }
  | { type: "RESOLVE_DIAGRAM_COMMENT"; commentId: string }
  | { type: "DELETE_DIAGRAM_COMMENT"; commentId: string }
  | { type: "ADD_NODE_COMMENT"; nodeId: string; text: string; author: string }
  | { type: "REPLY_NODE_COMMENT"; nodeId: string; commentId: string; text: string; author: string }
  | { type: "RESOLVE_NODE_COMMENT"; nodeId: string; commentId: string }
  | { type: "DELETE_NODE_COMMENT"; nodeId: string; commentId: string }
  | { type: "SELECT_NODE"; id: string | null }
  | { type: "SELECT_EDGE"; id: string | null }
  | { type: "SET_VIEW"; view: AppView }
  | { type: "TOGGLE_LEFT_PANEL" }
  | { type: "TOGGLE_RIGHT_PANEL" }
  | { type: "SET_RIGHT_PANEL_MODE"; mode: RightPanelMode }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; pan: { x: number; y: number } }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_EVIDENCE_NODE"; id: string | null }
  | { type: "SET_COMMENTS_TARGET"; target: AppState["commentsTarget"] }
  | { type: "SET_MODIFYING_NODE"; id: string | null }
  | { type: "SET_MODIFYING"; value: boolean }
  | { type: "SET_MODIFICATION_PREVIEW"; preview: ModificationPreview | null }
  | { type: "ACCEPT_MODIFICATION" }
  | { type: "LOAD_DEMO"; payload: Partial<AppState> }
  | { type: "RESET_ALL" }
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "MARK_SAVING" }
  | { type: "MARK_SAVED" };

function updateNode(model: ProcessModel, nodeId: string, fn: (n: ProcessModel["nodes"][number]) => void): ProcessModel {
  return {
    ...model,
    nodes: model.nodes.map((n) => {
      if (n.id !== nodeId) return n;
      const copy = { ...n, comments: n.comments.map((c) => ({ ...c, replies: [...c.replies] })) };
      fn(copy);
      return copy;
    }),
  };
}

function pushHistory(state: AppState, model: ProcessModel, label: string): Pick<AppState, "history" | "historyIndex"> {
  const truncated = state.history.slice(0, state.historyIndex + 1);
  const entry: HistoryEntry = { label, model, timestamp: Date.now() };
  const history = [...truncated, entry].slice(-50);
  return { history, historyIndex: history.length - 1 };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.text, savedStatus: "saving" };
    case "SET_PROCESS_NAME":
      return { ...state, processName: action.name };
    case "SET_ENHANCING":
      return { ...state, enhancing: action.value };
    case "SET_ENHANCED_PROMPT":
      return { ...state, enhancedPrompt: action.text, showEnhanceCompare: true, enhancing: false };
    case "USE_ENHANCED":
      return {
        ...state,
        activePromptIsEnhanced: action.value,
        prompt: action.value && state.enhancedPrompt ? state.enhancedPrompt : state.prompt,
        showEnhanceCompare: false,
      };
    case "CLOSE_ENHANCE_COMPARE":
      return { ...state, showEnhanceCompare: false };
    case "ADD_UPLOAD":
      return { ...state, uploads: [...state.uploads, action.file] };
    case "UPDATE_UPLOAD":
      return { ...state, uploads: state.uploads.map((u) => (u.id === action.id ? { ...u, ...action.patch } : u)) };
    case "REMOVE_UPLOAD":
      return { ...state, uploads: state.uploads.filter((u) => u.id !== action.id) };
    case "SET_PLANNING":
      return { ...state, planning: action.value };
    case "SET_PLAN":
      return { ...state, plan: action.plan, showPlanModal: action.plan !== null };
    case "UPDATE_PLAN":
      return { ...state, plan: action.plan };
    case "SET_SHOW_PLAN_MODAL":
      return { ...state, showPlanModal: action.value };
    case "SET_BUILDING":
      return { ...state, building: action.value };
    case "SET_BUILD_STAGE":
      return {
        ...state,
        buildStages: state.buildStages.map((s) => (s.key === action.key ? { ...s, status: action.status } : s)),
      };
    case "RESET_BUILD_STAGES":
      return { ...state, buildStages: emptyBuildStages() };
    case "APPLY_MODEL": {
      const mermaidText = generateMermaid(action.model);
      const hist = pushHistory(state, action.model, action.label);
      return {
        ...state,
        model: action.model,
        mermaidText,
        mermaidDraft: mermaidText,
        mermaidError: null,
        mermaidDirty: false,
        documentationStale: action.markDocStale ? state.documentation !== null : state.documentationStale,
        ...hist,
        savedStatus: "saving",
      };
    }
    case "SET_MERMAID_DRAFT":
      return { ...state, mermaidDraft: action.text, mermaidDirty: action.text !== state.mermaidText };
    case "SET_MERMAID_ERROR":
      return { ...state, mermaidError: action.error };
    case "RESET_MERMAID_DRAFT":
      return { ...state, mermaidDraft: state.mermaidText, mermaidError: null, mermaidDirty: false };
    case "SET_DOCUMENTATION":
      return { ...state, documentation: action.text, documentationEdited: !!action.markEdited, documentationStale: false };
    case "SET_DOC_STALE":
      return { ...state, documentationStale: action.value };
    case "SET_GENERATING_DOCS":
      return { ...state, generatingDocs: action.value };
    case "ADD_DIAGRAM_COMMENT":
      return {
        ...state,
        diagramComments: [
          ...state.diagramComments,
          { id: makeId("dc"), author: action.author, text: action.text, createdAt: Date.now(), resolved: false, replies: [] },
        ],
      };
    case "REPLY_DIAGRAM_COMMENT":
      return {
        ...state,
        diagramComments: state.diagramComments.map((c) =>
          c.id === action.commentId
            ? { ...c, replies: [...c.replies, { id: makeId("cr"), author: action.author, text: action.text, createdAt: Date.now() }] }
            : c,
        ),
      };
    case "RESOLVE_DIAGRAM_COMMENT":
      return {
        ...state,
        diagramComments: state.diagramComments.map((c) => (c.id === action.commentId ? { ...c, resolved: !c.resolved } : c)),
      };
    case "DELETE_DIAGRAM_COMMENT":
      return { ...state, diagramComments: state.diagramComments.filter((c) => c.id !== action.commentId) };
    case "ADD_NODE_COMMENT": {
      if (!state.model) return state;
      const model = updateNode(state.model, action.nodeId, (n) => {
        n.comments.push({ id: makeId("c"), author: action.author, text: action.text, createdAt: Date.now(), resolved: false, replies: [] });
      });
      return { ...state, model, savedStatus: "saving" };
    }
    case "REPLY_NODE_COMMENT": {
      if (!state.model) return state;
      const model = updateNode(state.model, action.nodeId, (n) => {
        const c = n.comments.find((c) => c.id === action.commentId);
        if (c) c.replies.push({ id: makeId("cr"), author: action.author, text: action.text, createdAt: Date.now() });
      });
      return { ...state, model, savedStatus: "saving" };
    }
    case "RESOLVE_NODE_COMMENT": {
      if (!state.model) return state;
      const model = updateNode(state.model, action.nodeId, (n) => {
        const c = n.comments.find((c) => c.id === action.commentId);
        if (c) c.resolved = !c.resolved;
      });
      return { ...state, model, savedStatus: "saving" };
    }
    case "DELETE_NODE_COMMENT": {
      if (!state.model) return state;
      const model = updateNode(state.model, action.nodeId, (n) => {
        n.comments = n.comments.filter((c) => c.id !== action.commentId);
      });
      return { ...state, model, savedStatus: "saving" };
    }
    case "SELECT_NODE":
      return { ...state, selectedNodeId: action.id, selectedEdgeId: null, rightPanelMode: "inspector", rightPanelOpen: true };
    case "SELECT_EDGE":
      return { ...state, selectedEdgeId: action.id, selectedNodeId: null, rightPanelMode: "inspector", rightPanelOpen: true };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "TOGGLE_LEFT_PANEL":
      return { ...state, leftPanelOpen: !state.leftPanelOpen };
    case "TOGGLE_RIGHT_PANEL":
      return { ...state, rightPanelOpen: !state.rightPanelOpen };
    case "SET_RIGHT_PANEL_MODE":
      return { ...state, rightPanelMode: action.mode, rightPanelOpen: true };
    case "SET_ZOOM":
      return { ...state, zoom: Math.min(2, Math.max(0.25, action.zoom)) };
    case "SET_PAN":
      return { ...state, pan: action.pan };
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const idx = state.historyIndex - 1;
      const entry = state.history[idx];
      const mermaidText = generateMermaid(entry.model);
      return {
        ...state,
        model: entry.model,
        mermaidText,
        mermaidDraft: mermaidText,
        mermaidError: null,
        mermaidDirty: false,
        historyIndex: idx,
        selectedNodeId: null,
        selectedEdgeId: null,
        savedStatus: "saving",
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      const entry = state.history[idx];
      const mermaidText = generateMermaid(entry.model);
      return {
        ...state,
        model: entry.model,
        mermaidText,
        mermaidDraft: mermaidText,
        mermaidError: null,
        mermaidDirty: false,
        historyIndex: idx,
        selectedNodeId: null,
        selectedEdgeId: null,
        savedStatus: "saving",
      };
    }
    case "SET_EVIDENCE_NODE":
      return { ...state, evidenceNodeId: action.id };
    case "SET_COMMENTS_TARGET":
      return { ...state, commentsTarget: action.target };
    case "SET_MODIFYING_NODE":
      return { ...state, modifyingNodeId: action.id, modificationPreview: null };
    case "SET_MODIFYING":
      return { ...state, modifying: action.value };
    case "SET_MODIFICATION_PREVIEW":
      return { ...state, modificationPreview: action.preview };
    case "ACCEPT_MODIFICATION": {
      if (!state.modificationPreview) return state;
      const model = state.modificationPreview.resultModel;
      const mermaidText = generateMermaid(model);
      const hist = pushHistory(state, model, state.modificationPreview.summary);
      return {
        ...state,
        model,
        mermaidText,
        mermaidDraft: mermaidText,
        mermaidDirty: false,
        ...hist,
        modificationPreview: null,
        modifyingNodeId: null,
        documentationStale: state.documentation !== null,
        savedStatus: "saving",
      };
    }
    case "LOAD_DEMO":
      return { ...initialState(), hydrated: true, ...action.payload };
    case "RESET_ALL":
      return { ...initialState(), hydrated: true };
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };
    case "MARK_SAVING":
      return { ...state, savedStatus: "saving" };
    case "MARK_SAVED":
      return { ...state, savedStatus: "saved" };
    default:
      return state;
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  notify: (message: string, tone?: Toast["tone"]) => void;
}

const AppContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "flowbuilder_ai_state_v1";

const PERSIST_FIELDS: (keyof AppState)[] = [
  "processName",
  "prompt",
  "enhancedPrompt",
  "activePromptIsEnhanced",
  "uploads",
  "plan",
  "model",
  "mermaidText",
  "documentation",
  "documentationEdited",
  "documentationStale",
  "diagramComments",
  "isDemo",
  "view",
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const payload = JSON.parse(raw) as Partial<AppState>;
        const model = payload.model ?? null;
        const mermaidText = model ? generateMermaid(model) : "";
        dispatch({
          type: "HYDRATE",
          payload: {
            ...payload,
            mermaidText,
            mermaidDraft: mermaidText,
            history: model ? [{ label: "Restored session", model, timestamp: Date.now() }] : [],
            historyIndex: model ? 0 : -1,
          },
        });
      } else {
        dispatch({ type: "HYDRATE", payload: {} });
      }
    } catch {
      dispatch({ type: "HYDRATE", payload: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const handle = setTimeout(() => {
      try {
        const payload: Partial<AppState> = {};
        for (const key of PERSIST_FIELDS) {
          (payload as Record<string, unknown>)[key] = state[key];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // storage unavailable — ignore in prototype
      }
      dispatch({ type: "MARK_SAVED" });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.hydrated,
    state.processName,
    state.prompt,
    state.enhancedPrompt,
    state.uploads,
    state.plan,
    state.model,
    state.documentation,
    state.diagramComments,
  ]);

  const notify = useMemo(
    () => (message: string, tone: Toast["tone"] = "default") => {
      const id = makeId("toast");
      dispatch({ type: "ADD_TOAST", toast: { id, message, tone } });
      setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 4200);
    },
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = useMemo(() => ({ state, dispatch, notify }), [state, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function ensureDocumentationFresh(model: ProcessModel, title: string): string {
  return generateDocumentation(model, title);
}

export { mergeMetadata, parseMermaid };
export type { CommentThread, CommentReply };
