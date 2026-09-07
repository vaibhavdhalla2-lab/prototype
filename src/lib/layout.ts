import type { ProcessModel } from "../types";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
}

export interface LayoutEdge {
  id: string;
  path: string;
  labelX: number;
  labelY: number;
}

export interface LayoutResult {
  nodes: Map<string, LayoutNode>;
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const LAYER_GAP = 150;
const COL_GAP = 60;
const DEFAULT_W = 220;
const DEFAULT_H = 92;
const DECISION_SIZE = 150;
const TERMINAL_H = 64;

function sizeFor(type: string): { w: number; h: number } {
  if (type === "decision") return { w: DECISION_SIZE, h: DECISION_SIZE };
  if (type === "start" || type === "end") return { w: 180, h: TERMINAL_H };
  return { w: DEFAULT_W, h: DEFAULT_H };
}

export function computeLayout(model: ProcessModel): LayoutResult {
  const { nodes, edges } = model;
  const nodeIds = nodes.map((n) => n.id);
  const outAdj = new Map<string, string[]>();
  const inAdj = new Map<string, string[]>();
  for (const id of nodeIds) {
    outAdj.set(id, []);
    inAdj.set(id, []);
  }
  for (const e of edges) {
    if (!outAdj.has(e.from) || !inAdj.has(e.to)) continue;
    outAdj.get(e.from)!.push(e.to);
    inAdj.get(e.to)!.push(e.from);
  }

  // Layer assignment via Kahn's algorithm (longest path from roots).
  const layer = new Map<string, number>();
  const indegree = new Map<string, number>();
  for (const id of nodeIds) indegree.set(id, inAdj.get(id)!.length);
  const queue: string[] = nodeIds.filter((id) => indegree.get(id) === 0);
  if (queue.length === 0 && nodeIds.length > 0) queue.push(nodeIds[0]);
  for (const id of queue) layer.set(id, 0);
  const visited = new Set<string>();
  let head = 0;
  let guard = 0;
  while (head < queue.length && guard < nodeIds.length * 4 + 10) {
    guard++;
    const id = queue[head++];
    if (visited.has(id)) continue;
    visited.add(id);
    const l = layer.get(id) ?? 0;
    for (const next of outAdj.get(id) ?? []) {
      const nl = Math.max(layer.get(next) ?? 0, l + 1);
      layer.set(next, nl);
      const deg = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, deg);
      if (deg <= 0 && !visited.has(next)) {
        queue.push(next);
      } else if (!queue.includes(next) && !visited.has(next)) {
        queue.push(next);
      }
    }
  }
  for (const id of nodeIds) {
    if (!layer.has(id)) layer.set(id, (Math.max(0, ...Array.from(layer.values())) || 0) + 1);
  }

  const layers = new Map<number, string[]>();
  for (const id of nodeIds) {
    const l = layer.get(id) ?? 0;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(id);
  }

  // Barycenter ordering pass for nicer left-right placement of branches.
  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
  const positionInLayer = new Map<string, number>();
  for (const lk of sortedLayerKeys) {
    const ids = layers.get(lk)!;
    if (lk === sortedLayerKeys[0]) {
      ids.forEach((id, i) => positionInLayer.set(id, i));
      continue;
    }
    const withScore = ids.map((id) => {
      const preds = inAdj.get(id) ?? [];
      const score = preds.length
        ? preds.reduce((sum, p) => sum + (positionInLayer.get(p) ?? 0), 0) / preds.length
        : 0;
      return { id, score };
    });
    withScore.sort((a, b) => a.score - b.score);
    withScore.forEach((item, i) => positionInLayer.set(item.id, i));
    layers.set(
      lk,
      withScore.map((w) => w.id),
    );
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const layoutNodes = new Map<string, LayoutNode>();
  let maxWidth = 0;

  for (const lk of sortedLayerKeys) {
    const ids = layers.get(lk)!;
    const sizes = ids.map((id) => sizeFor(nodeById.get(id)?.type ?? "process"));
    const totalWidth = sizes.reduce((s, sz) => s + sz.w, 0) + COL_GAP * Math.max(0, ids.length - 1);
    maxWidth = Math.max(maxWidth, totalWidth);
    let cursorX = -totalWidth / 2;
    const y = lk * (DEFAULT_H + LAYER_GAP);
    ids.forEach((id, i) => {
      const { w, h } = sizes[i];
      layoutNodes.set(id, { id, x: cursorX + w / 2, y: y + h / 2, w, h, layer: lk });
      cursorX += w + COL_GAP;
    });
  }

  // Center all layers around x=0, then shift so min x is 0.
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ln of layoutNodes.values()) {
    minX = Math.min(minX, ln.x - ln.w / 2);
    maxX = Math.max(maxX, ln.x + ln.w / 2);
    maxY = Math.max(maxY, ln.y + ln.h / 2);
  }
  if (!isFinite(minX)) minX = 0;
  const pad = 60;
  const shiftX = pad - minX;
  for (const ln of layoutNodes.values()) {
    ln.x += shiftX;
  }

  const layoutEdges: LayoutEdge[] = [];
  for (const e of edges) {
    const from = layoutNodes.get(e.from);
    const to = layoutNodes.get(e.to);
    if (!from || !to) continue;
    const x1 = from.x;
    const y1 = from.y + from.h / 2;
    const x2 = to.x;
    const y2 = to.y - to.h / 2;
    const midY = (y1 + y2) / 2;
    const path =
      Math.abs(x1 - x2) < 2
        ? `M ${x1} ${y1} L ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    layoutEdges.push({ id: e.id, path, labelX: (x1 + x2) / 2, labelY: midY });
  }

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: maxX - minX + pad * 2,
    height: maxY + pad * 2,
  };
}
