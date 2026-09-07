import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { computeLayout } from "../lib/layout";
import { canvasElRef } from "../lib/canvasRef";
import DiagramNode from "./DiagramNode";
import EmptyState from "./EmptyState";
import { IconMinus, IconPlus, IconFit } from "./icons";

export default function Canvas() {
  const { state, dispatch } = useApp();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => (state.model ? computeLayout(state.model) : null), [state.model]);
  const exceptionNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (state.model) {
      for (const e of state.model.edges) {
        if (e.label && /exception|reject|fail|escalat/i.test(e.label)) ids.add(e.to);
      }
    }
    return ids;
  }, [state.model]);

  useEffect(() => {
    canvasElRef.current = viewportRef.current?.querySelector("[data-canvas-stage]") ?? null;
  }, [layout]);

  useEffect(() => {
    if (layout && state.pan.x === 0 && state.pan.y === 0 && state.zoom === 1) {
      fitToScreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.model !== null]);

  function fitToScreen() {
    if (!layout || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const padding = 48;
    const scale = Math.min((rect.width - padding * 2) / layout.width, (rect.height - padding * 2) / layout.height, 1.15);
    const zoom = Math.max(0.25, Math.min(2, scale));
    const panX = (rect.width - layout.width * zoom) / 2;
    const panY = (rect.height - layout.height * zoom) / 2;
    dispatch({ type: "SET_ZOOM", zoom });
    dispatch({ type: "SET_PAN", pan: { x: panX, y: panY } });
  }

  function resetZoom() {
    if (!layout || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    dispatch({ type: "SET_ZOOM", zoom: 1 });
    dispatch({ type: "SET_PAN", pan: { x: (rect.width - layout.width) / 2, y: (rect.height - layout.height) / 2 } });
  }

  function zoomBy(delta: number, center?: { x: number; y: number }) {
    const rect = viewportRef.current?.getBoundingClientRect();
    const cx = center?.x ?? (rect ? rect.width / 2 : 0);
    const cy = center?.y ?? (rect ? rect.height / 2 : 0);
    const newZoom = Math.min(2, Math.max(0.25, state.zoom + delta));
    const ratio = newZoom / state.zoom;
    const panX = cx - (cx - state.pan.x) * ratio;
    const panY = cy - (cy - state.pan.y) * ratio;
    dispatch({ type: "SET_ZOOM", zoom: newZoom });
    dispatch({ type: "SET_PAN", pan: { x: panX, y: panY } });
  }

  function onWheel(e: React.WheelEvent) {
    if (!layout) return;
    e.preventDefault();
    const rect = viewportRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    zoomBy(-e.deltaY * 0.0015, { x: cx, y: cy });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: state.pan.x, panY: state.pan.y };
    setDragging(true);
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    dispatch({ type: "SET_PAN", pan: { x: dragState.current.panX + dx, y: dragState.current.panY + dy } });
  }
  function endDrag() {
    dragState.current = null;
    setDragging(false);
  }

  if (!state.model || !layout) {
    return (
      <div className="relative flex-1 overflow-hidden bg-canvas">
        <EmptyState />
      </div>
    );
  }

  const selectedEdge = state.selectedEdgeId ? state.model.edges.find((e) => e.id === state.selectedEdgeId) : null;

  return (
    <div className="relative flex-1 overflow-hidden bg-canvas">
      <div
        ref={viewportRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={() => dispatch({ type: "SELECT_NODE", id: null })}
        className={`h-full w-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: `${state.pan.x}px ${state.pan.y}px`,
        }}
      >
        <div
          data-canvas-stage
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
            transformOrigin: "0 0",
            background: "var(--color-surface)",
          }}
          className="relative rounded-xl shadow-sm"
        >
          <svg width={layout.width} height={layout.height} className="block overflow-visible">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--color-ink-faint)" />
              </marker>
              <marker id="arrow-selected" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--color-brand)" />
              </marker>
            </defs>
            {layout.edges.map((le) => {
              const edge = state.model!.edges.find((e) => e.id === le.id)!;
              const selected = state.selectedEdgeId === edge.id;
              return (
                <g key={le.id}>
                  <path
                    d={le.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "SELECT_EDGE", id: edge.id });
                    }}
                    className="cursor-pointer"
                  />
                  <path
                    d={le.path}
                    fill="none"
                    stroke={selected ? "var(--color-brand)" : "var(--color-ink-faint)"}
                    strokeWidth={selected ? 2.5 : 1.75}
                    markerEnd={selected ? "url(#arrow-selected)" : "url(#arrow)"}
                  />
                  {edge.label && (
                    <text
                      x={le.labelX}
                      y={le.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={11.5}
                      fontWeight={600}
                      fill={selected ? "var(--color-brand-deep)" : "var(--color-ink-soft)"}
                      stroke="var(--color-surface)"
                      strokeWidth={4}
                      paintOrder="stroke"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
            {state.model.nodes.map((n) => {
              const ln = layout.nodes.get(n.id);
              if (!ln) return null;
              return (
                <DiagramNode key={n.id} node={n} layout={ln} selected={state.selectedNodeId === n.id} isException={exceptionNodeIds.has(n.id)} />
              );
            })}
          </svg>
        </div>
      </div>

      {selectedEdge && (
        <div className="absolute left-4 top-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-soft shadow-sm">
          Connection: <span className="font-medium text-ink">{state.model.nodes.find((n) => n.id === selectedEdge.from)?.label}</span>
          {" → "}
          <span className="font-medium text-ink">{state.model.nodes.find((n) => n.id === selectedEdge.to)?.label}</span>
          {selectedEdge.label && <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5">{selectedEdge.label}</span>}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-surface px-1.5 py-1.5 shadow-md">
        <button onClick={() => zoomBy(-0.15)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2" title="Zoom out">
          <IconMinus />
        </button>
        <span className="w-12 text-center text-xs font-semibold text-ink-soft">{Math.round(state.zoom * 100)}%</span>
        <button onClick={() => zoomBy(0.15)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2" title="Zoom in">
          <IconPlus />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button onClick={fitToScreen} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2" title="Fit to screen">
          <IconFit /> Fit
        </button>
        <button onClick={resetZoom} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2" title="Reset zoom">
          Reset
        </button>
      </div>
    </div>
  );
}
