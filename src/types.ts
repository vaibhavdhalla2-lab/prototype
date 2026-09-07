export type ComponentType = "start" | "process" | "decision" | "io" | "end";

export type SourceType = "document" | "email" | "slack" | "video";

export interface SourceRef {
  id: string;
  type: SourceType;
  title: string;
  locator: string;
  excerpt: string;
  confidence: "High" | "Medium" | "Low";
  demo?: boolean;
}

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface CommentThread {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

export interface ProcessNode {
  id: string;
  type: ComponentType;
  label: string;
  description?: string;
  actor?: string;
  sources: SourceRef[];
  comments: CommentThread[];
  aiGenerated?: boolean;
}

export interface ProcessEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface ProcessModel {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
}

export type UploadKind = "document" | "video";

export interface UploadedSourceFile {
  id: string;
  kind: UploadKind;
  name: string;
  fileType: string;
  size?: number;
  duration?: string;
  status: "processing" | "ready" | "error";
  simulated: boolean;
  previewUrl?: string;
  addedAt: number;
}

export interface PlanStep {
  id: string;
  name: string;
  actor: string;
}

export interface PlanDecision {
  id: string;
  question: string;
  afterStepId: string;
  yesLabel: string;
  noLabel: string;
  onNo: { stepName: string; actor: string } | "end";
}

export interface ProcessPlan {
  understanding: string;
  steps: PlanStep[];
  actors: string[];
  decisions: PlanDecision[];
  exceptions: string[];
  gaps: string[];
  processTitle: string;
}

export interface EnhancedPromptResult {
  original: string;
  enhanced: string;
}

export interface HistoryEntry {
  label: string;
  model: ProcessModel;
  mermaid: string;
  timestamp: number;
}

export interface ModificationPreview {
  instruction: string;
  targetNodeId: string;
  summary: string;
  removedNodeIds: string[];
  addedNodes: ProcessNode[];
  modifiedNodes: { before: ProcessNode; after: ProcessNode }[];
  edgesBefore: ProcessEdge[];
  edgesAfter: ProcessEdge[];
  resultModel: ProcessModel;
}

export interface DiagramComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

export type AppView = "diagram" | "mermaid" | "documentation";
export type RightPanelMode = "inspector" | "comments";
