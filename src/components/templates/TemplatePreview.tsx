import { useMemo } from "react";
import type { ProcessModel } from "../../types";
import { computeLayout } from "../../lib/layout";

const FILL: Record<string, string> = {
  start: "var(--color-success)",
  end: "var(--color-ink-faint)",
  process: "var(--color-brand-deep)",
  decision: "var(--color-warn)",
  io: "var(--color-brand)",
};

export default function TemplatePreview({ model }: { model: ProcessModel }) {
  const layout = useMemo(() => computeLayout(model), [model]);

  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {layout.edges.map((e) => (
        <path key={e.id} d={e.path} fill="none" stroke="var(--color-border)" strokeWidth={3} />
      ))}
      {model.nodes.map((n) => {
        const ln = layout.nodes.get(n.id);
        if (!ln) return null;
        const fill = FILL[n.type] ?? "var(--color-ink-faint)";
        if (n.type === "decision") {
          return (
            <rect
              key={n.id}
              x={ln.x - ln.w / 2}
              y={ln.y - ln.h / 2}
              width={ln.w}
              height={ln.h}
              fill={fill}
              opacity={0.85}
              transform={`rotate(45 ${ln.x} ${ln.y})`}
              rx={6}
            />
          );
        }
        const rounded = n.type === "start" || n.type === "end";
        return (
          <rect
            key={n.id}
            x={ln.x - ln.w / 2}
            y={ln.y - ln.h / 2}
            width={ln.w}
            height={ln.h}
            rx={rounded ? ln.h / 2 : 10}
            fill={fill}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}
