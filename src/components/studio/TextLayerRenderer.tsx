import type { TextLayer } from "../../lib/store";

function applyCase(content: string, mode: TextLayer["caseMode"]): string {
  if (mode === "upper") return content.toUpperCase();
  if (mode === "lower") return content.toLowerCase();
  return content;
}

/** Rough bounding box for a text layer at scale=1 — used both to lay out the SVG text itself and to size the LayerNode selection/handle box. Doesn't need to be pixel-perfect, just close enough for handles to sit near the visible text. */
export function estimateTextSize(layer: Pick<TextLayer, "content" | "fontSize" | "letterSpacing" | "lineHeight">): { width: number; height: number } {
  const lines = (layer.content || " ").split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const width = longest * layer.fontSize * 0.58 + longest * layer.letterSpacing;
  const height = lines.length * layer.fontSize * layer.lineHeight;
  return { width: Math.max(width, layer.fontSize), height: Math.max(height, layer.fontSize) };
}

export default function TextLayerRenderer({ layer }: { layer: TextLayer }) {
  const lines = applyCase(layer.content || "", layer.caseMode).split("\n");
  const { height } = estimateTextSize(layer);
  const startY = -height / 2 + (layer.fontSize * layer.lineHeight) / 2;
  const anchor = layer.align === "left" ? "start" : layer.align === "right" ? "end" : "middle";
  const { width } = estimateTextSize(layer);
  const x = layer.align === "left" ? -width / 2 : layer.align === "right" ? width / 2 : 0;

  return (
    <text
      x={x}
      y={startY}
      textAnchor={anchor}
      fontFamily={`${layer.fontFamily}, serif`}
      fontSize={layer.fontSize}
      fontWeight={layer.fontWeight}
      fontStyle={layer.italic ? "italic" : "normal"}
      textDecoration={layer.underline ? "underline" : "none"}
      letterSpacing={layer.letterSpacing}
      fill={layer.color}
      opacity={layer.opacity}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : layer.fontSize * layer.lineHeight}>
          {line || " "}
        </tspan>
      ))}
    </text>
  );
}
