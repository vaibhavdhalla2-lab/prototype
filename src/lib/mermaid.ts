import type { ComponentType, ProcessEdge, ProcessModel, ProcessNode } from "../types";
import { nodeRefId, makeId } from "./id";

function escapeLabel(label: string): string {
  return label.replace(/"/g, "&quot;").trim();
}

function unescapeLabel(label: string): string {
  return label.replace(/&quot;/g, '"');
}

function shapeFor(node: ProcessNode): string {
  const label = escapeLabel(node.label);
  switch (node.type) {
    case "start":
    case "end":
      return `(["${label}"])`;
    case "decision":
      return `{"${label}"}`;
    case "io":
      return `[/"${label}"/]`;
    default:
      return `["${label}"]`;
  }
}

export function generateMermaid(model: ProcessModel): string {
  const lines: string[] = ["flowchart TD"];
  for (const node of model.nodes) {
    lines.push(`    ${node.id}${shapeFor(node)}`);
  }
  if (model.edges.length) lines.push("");
  for (const edge of model.edges) {
    const labelPart = edge.label ? `|"${escapeLabel(edge.label)}"| ` : "";
    lines.push(`    ${edge.from} --> ${labelPart}${edge.to}`);
  }
  return lines.join("\n");
}

export interface MermaidParseError {
  line: number;
  message: string;
  raw: string;
}

export interface MermaidParseResult {
  ok: boolean;
  model?: ProcessModel;
  error?: MermaidParseError;
}

interface ShapeMatch {
  type: ComponentType | "unknown";
  label: string;
}

const SHAPE_PATTERNS: { re: RegExp; type: ComponentType | "unknown" }[] = [
  { re: /^\(\((.*)\)\)$/s, type: "start" },
  { re: /^\(\[(.*)\]\)$/s, type: "start" },
  { re: /^\{(.*)\}$/s, type: "decision" },
  { re: /^\[\/(.*)\/\]$/s, type: "io" },
  { re: /^\[(.*)\]$/s, type: "process" },
];

function parseShape(raw: string): ShapeMatch | null {
  const trimmed = raw.trim();
  for (const { re, type } of SHAPE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      let label = m[1].trim();
      if (label.startsWith('"') && label.endsWith('"')) label = label.slice(1, -1);
      return { type, label: unescapeLabel(label) };
    }
  }
  return null;
}

const NODE_REF_RE = /^([A-Za-z][A-Za-z0-9_]*)/;
const SHAPE_OPEN_RE = /^(\(\(|\(\[|\{|\[\/|\[)/;

function extractNodeToken(segment: string): { id: string; shape: ShapeMatch | null; rest: string } | null {
  const trimmed = segment.trim();
  const idMatch = trimmed.match(NODE_REF_RE);
  if (!idMatch) return null;
  const id = idMatch[1];
  let rest = trimmed.slice(id.length);
  if (!SHAPE_OPEN_RE.test(rest)) {
    return { id, shape: null, rest };
  }
  const closers: Record<string, string> = { "((": "))", "([": "])", "{": "}", "[/": "/]", "[": "]" };
  const openKey = Object.keys(closers).find((k) => rest.startsWith(k));
  if (!openKey) return { id, shape: null, rest };
  const closer = closers[openKey];
  const closeIdx = rest.indexOf(closer, openKey.length);
  if (closeIdx === -1) {
    throw new Error(`Unclosed shape starting with "${openKey}"`);
  }
  const shapeText = rest.slice(0, closeIdx + closer.length);
  rest = rest.slice(closeIdx + closer.length);
  const shape = parseShape(shapeText);
  return { id, shape, rest };
}

export function parseMermaid(text: string): MermaidParseResult {
  const rawLines = text.split("\n");
  const nodes = new Map<string, ProcessNode>();
  const nodeOrder: string[] = [];
  const edges: ProcessEdge[] = [];

  const ensureNode = (id: string, shape: ShapeMatch | null) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        type: shape && shape.type !== "unknown" ? shape.type : "process",
        label: shape ? shape.label : id,
        sources: [],
        comments: [],
        aiGenerated: true,
      });
      nodeOrder.push(id);
    } else if (shape) {
      const existing = nodes.get(id)!;
      existing.label = shape.label;
      if (shape.type !== "unknown") existing.type = shape.type;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const lineNo = i + 1;
    let line = rawLines[i];
    const commentIdx = line.indexOf("%%");
    if (commentIdx !== -1) line = line.slice(0, commentIdx);
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)$/i.test(trimmed)) continue;
    if (/^(flowchart|graph)$/i.test(trimmed)) continue;

    if (!trimmed.includes("-->")) {
      try {
        const tok = extractNodeToken(trimmed);
        if (!tok || tok.rest.trim() !== "") {
          return { ok: false, error: { line: lineNo, message: `Unrecognized syntax near line ${lineNo}.`, raw: trimmed } };
        }
        ensureNode(tok.id, tok.shape);
      } catch (e) {
        return { ok: false, error: { line: lineNo, message: (e as Error).message + ` near line ${lineNo}.`, raw: trimmed } };
      }
      continue;
    }

    const arrowSegments = trimmed.split("-->");
    if (arrowSegments.some((s) => s.trim() === "")) {
      return { ok: false, error: { line: lineNo, message: `Mermaid syntax error near line ${lineNo}: dangling connector.`, raw: trimmed } };
    }

    let prevId: string | null = null;
    for (let s = 0; s < arrowSegments.length; s++) {
      let seg = arrowSegments[s];
      let label: string | undefined;
      if (s > 0) {
        const segTrim = seg.trimStart();
        const labelMatch = segTrim.match(/^\|(.*?)\|/);
        if (labelMatch) {
          label = labelMatch[1].trim();
          if (label.startsWith('"') && label.endsWith('"')) label = label.slice(1, -1);
          label = unescapeLabel(label);
          seg = segTrim.slice(labelMatch[0].length);
        }
      }
      let tok;
      try {
        tok = extractNodeToken(seg);
      } catch (e) {
        return { ok: false, error: { line: lineNo, message: (e as Error).message + ` near line ${lineNo}.`, raw: trimmed } };
      }
      if (!tok || tok.rest.trim() !== "") {
        return { ok: false, error: { line: lineNo, message: `Mermaid syntax error near line ${lineNo}.`, raw: trimmed } };
      }
      ensureNode(tok.id, tok.shape);
      if (prevId) {
        edges.push({ id: makeId("e"), from: prevId, to: tok.id, label });
      }
      prevId = tok.id;
    }
  }

  if (nodes.size === 0) {
    return { ok: false, error: { line: 1, message: "No diagram nodes found. Add at least one node.", raw: "" } };
  }

  // Post-pass: stadium-shaped nodes with no outgoing edges become "end", those with no incoming become "start".
  const outgoing = new Map<string, number>();
  const incoming = new Map<string, number>();
  for (const e of edges) {
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  for (const id of nodeOrder) {
    const n = nodes.get(id)!;
    if (n.type === "start") {
      const hasOut = (outgoing.get(id) ?? 0) > 0;
      const hasIn = (incoming.get(id) ?? 0) > 0;
      if (hasIn && !hasOut) n.type = "end";
    }
  }

  const model: ProcessModel = { nodes: nodeOrder.map((id) => nodes.get(id)!), edges };
  return { ok: true, model };
}

export function mergeMetadata(prev: ProcessModel, next: ProcessModel): ProcessModel {
  const prevById = new Map(prev.nodes.map((n) => [n.id, n]));
  const nodes = next.nodes.map((n) => {
    const old = prevById.get(n.id);
    if (!old) return { ...n, id: n.id || nodeRefId() };
    return {
      ...n,
      description: old.description,
      actor: old.actor,
      sources: old.sources,
      comments: old.comments,
      aiGenerated: old.aiGenerated,
    };
  });
  return { nodes, edges: next.edges };
}
