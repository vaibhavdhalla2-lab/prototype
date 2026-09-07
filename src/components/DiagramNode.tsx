import type { ProcessNode } from "../types";
import type { LayoutNode } from "../lib/layout";
import { useApp } from "../lib/store";
import { IconPaperclip, IconComment, IconSparkle } from "./icons";

const TYPE_STYLES: Record<ProcessNode["type"], { bg: string; border: string; text: string }> = {
  start: { bg: "bg-success-soft", border: "border-success/40", text: "text-success" },
  end: { bg: "bg-ink/5", border: "border-ink-faint/40", text: "text-ink-soft" },
  process: { bg: "bg-brand-soft", border: "border-brand/30", text: "text-ink" },
  decision: { bg: "bg-warn-soft", border: "border-warn/40", text: "text-warn" },
  io: { bg: "bg-surface-2", border: "border-ink-faint/40", text: "text-ink-soft" },
};

const EXCEPTION_STYLE = { bg: "bg-exception-soft", border: "border-exception/50", text: "text-exception" };

export default function DiagramNode({
  node,
  layout,
  selected,
  isException,
}: {
  node: ProcessNode;
  layout: LayoutNode;
  selected: boolean;
  isException?: boolean;
}) {
  const { dispatch } = useApp();
  const style = isException && node.type === "process" ? EXCEPTION_STYLE : TYPE_STYLES[node.type];

  const commonProps = {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "SELECT_NODE", id: node.id });
    },
  };

  if (node.type === "start" || node.type === "end") {
    return (
      <foreignObject x={layout.x - layout.w / 2} y={layout.y - layout.h / 2} width={layout.w} height={layout.h}>
        <div
          {...commonProps}
          className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border-2 px-3 text-center shadow-sm transition ${style.bg} ${
            selected ? "border-brand ring-4 ring-brand/15" : style.border
          }`}
        >
          <span className={`text-[13px] font-semibold ${style.text}`}>{node.label}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">{node.type}</span>
        </div>
      </foreignObject>
    );
  }

  if (node.type === "decision") {
    return (
      <foreignObject x={layout.x - layout.w / 2} y={layout.y - layout.h / 2} width={layout.w} height={layout.h} style={{ overflow: "visible" }}>
        <div {...commonProps} className="relative h-full w-full cursor-pointer">
          <div
            className={`h-full w-full border-2 shadow-sm transition ${style.bg} ${selected ? "border-brand ring-4 ring-brand/15" : style.border}`}
            style={{ clipPath: "polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)" }}
          />
          <div className="absolute inset-[22%] flex flex-col items-center justify-center gap-1 text-center">
            <span className="line-clamp-3 text-[11.5px] font-semibold leading-tight text-ink">{node.label}</span>
          </div>
          {(node.sources.length > 0 || node.comments.length > 0) && (
            <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1">
              {node.sources.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "SET_EVIDENCE_NODE", id: node.id });
                  }}
                  className="flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-soft shadow-sm hover:bg-surface-2"
                >
                  <IconPaperclip className="h-2.5 w-2.5" /> {node.sources.length}
                </button>
              )}
              {node.comments.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "SET_COMMENTS_TARGET", target: { scope: "node", nodeId: node.id } });
                    dispatch({ type: "SET_RIGHT_PANEL_MODE", mode: "comments" });
                  }}
                  className="flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-soft shadow-sm hover:bg-surface-2"
                >
                  <IconComment className="h-2.5 w-2.5" /> {node.comments.length}
                </button>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    );
  }

  const isIo = node.type === "io";

  return (
    <foreignObject x={layout.x - layout.w / 2} y={layout.y - layout.h / 2} width={layout.w} height={layout.h}>
      <div
        {...commonProps}
        className={`relative flex h-full w-full cursor-pointer flex-col justify-center gap-1 border shadow-sm transition ${style.bg} ${
          selected ? "border-brand ring-4 ring-brand/15" : style.border
        } ${isIo ? "px-7 py-2" : "rounded-xl px-3 py-2"}`}
        style={isIo ? { clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)" } : undefined}
      >
        {node.aiGenerated && (
          <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-white" title="AI-generated">
            <IconSparkle className="h-2.5 w-2.5" />
          </span>
        )}
        <p className="line-clamp-2 pr-4 text-[13px] font-semibold leading-tight text-ink">{node.label}</p>
        {node.actor && <p className="truncate text-[11px] text-ink-soft">{node.actor}</p>}
        <div className="mt-0.5 flex items-center gap-2">
          {node.sources.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "SET_EVIDENCE_NODE", id: node.id });
              }}
              className="flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-soft hover:bg-border-soft"
            >
              <IconPaperclip className="h-2.5 w-2.5" /> {node.sources.length}
            </button>
          )}
          {node.comments.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "SET_COMMENTS_TARGET", target: { scope: "node", nodeId: node.id } });
                dispatch({ type: "SET_RIGHT_PANEL_MODE", mode: "comments" });
              }}
              className="flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-soft hover:bg-border-soft"
            >
              <IconComment className="h-2.5 w-2.5" /> {node.comments.length}
            </button>
          )}
        </div>
      </div>
    </foreignObject>
  );
}

