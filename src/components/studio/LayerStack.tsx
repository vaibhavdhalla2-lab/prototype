import type { PointerEvent as ReactPointerEvent } from "react";
import { useDesign, type DrawTool, type SmoothingLevel, type ImageLayer } from "../../lib/store";
import DrawLayer from "./DrawLayer";
import LayerNode from "./LayerNode";
import TextLayerRenderer, { estimateTextSize } from "./TextLayerRenderer";
import ShapeRenderer, { GRAPHIC_BASE } from "./ShapeRenderer";

export type CanvasMode = "move" | "draw" | "text" | "none";

interface LayerStackProps {
  side: "front" | "back";
  printArea: { x: number; y: number; width: number; height: number };
  mode: CanvasMode;
  eraseColor: string;
  drawTool: DrawTool;
  drawColor: string;
  drawWidth: number;
  drawOpacity: number;
  smoothing: SmoothingLevel;
  /** Called with a print-area-relative 0..1 point when the user taps empty canvas while the Text tool is active. */
  onCreateText?: (side: "front" | "back", x: number, y: number) => void;
}

function svgPoint(e: ReactPointerEvent<SVGElement>): { x: number; y: number } {
  const target = e.currentTarget as SVGGraphicsElement;
  const svg = target.ownerSVGElement;
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}

function imageBoxSize(layer: ImageLayer) {
  const BASE = 96;
  if (!layer.naturalWidth || !layer.naturalHeight) return { width: BASE, height: BASE };
  const ratio = layer.naturalWidth / layer.naturalHeight;
  return ratio >= 1 ? { width: BASE, height: BASE / ratio } : { width: BASE * ratio, height: BASE };
}

/**
 * Renders every layer on one side of the product, in stack order — the
 * single place that turns the generic `design.layers` list into actual SVG
 * content. Used identically by the main canvas and by the magnifier's
 * zoomed detail view, so editing at either scale hits the exact same
 * interactive elements (just rendered bigger).
 */
export default function LayerStack({ side, printArea, mode, eraseColor, drawTool, drawColor, drawWidth, drawOpacity, smoothing, onCreateText }: LayerStackProps) {
  const design = useDesign();
  const layers = design.layersFor(side);

  const onCanvasTap = (e: ReactPointerEvent<SVGRectElement>) => {
    const p = svgPoint(e);
    const x = Math.min(1, Math.max(0, (p.x - printArea.x) / printArea.width));
    const y = Math.min(1, Math.max(0, (p.y - printArea.y) / printArea.height));
    onCreateText?.(side, x, y);
  };

  // The drawing layer for this side is created lazily (on the first stroke), so it
  // may not exist yet in `design.layers` — but the interactive draw surface must be
  // mounted regardless, otherwise the very first stroke could never be drawn. Render
  // it unconditionally here (via the always-safe strokesFront/strokesBack getters)
  // instead of only when a matching "drawing" layer already exists in the list.
  const drawingLayer = layers.find((l) => l.type === "drawing");
  const strokes = side === "front" ? design.strokesFront : design.strokesBack;
  const refined = side === "front" ? design.refinedFront : design.refinedBack;
  const drawingVisible = drawingLayer ? drawingLayer.visible : true;
  const drawingLocked = drawingLayer ? drawingLayer.locked : false;

  return (
    <>
      {/* rendered first (bottom of the stack) so existing layers on top still capture their own clicks for select/move */}
      <DrawLayer
        strokes={strokes}
        interactive={mode === "draw" && drawingVisible && !drawingLocked}
        tool={drawTool}
        color={drawColor}
        eraseColor={eraseColor}
        widthOverride={drawWidth}
        opacityOverride={drawOpacity}
        smoothing={smoothing}
        refined={refined}
        printArea={printArea}
        onStrokeEnd={(s) => design.addStroke(side, s)}
      />
      {mode === "text" && (
        <rect x={0} y={0} width={360} height={440} fill="transparent" style={{ cursor: "text", touchAction: "none" }} onPointerDown={onCanvasTap} />
      )}
      {layers.map((layer) => {
        if (layer.type === "drawing") return null;
        if (!layer.visible) return null;
        const selected = design.selectedLayerId === layer.id;
        const interactive = mode === "move" || mode === "text";
        const size = layer.type === "text" ? estimateTextSize(layer) : layer.type === "image" ? imageBoxSize(layer) : { width: GRAPHIC_BASE, height: GRAPHIC_BASE };

        return (
          <LayerNode
            key={layer.id}
            transform={layer}
            printArea={printArea}
            size={size}
            interactive={interactive}
            selected={selected}
            locked={layer.locked}
            onSelect={() => design.selectLayer(layer.id)}
            onChange={(patch) => design.updateLayer(layer.id, patch)}
          >
            {layer.type === "text" && <TextLayerRenderer layer={layer} />}
            {layer.type === "graphic" && <ShapeRenderer shape={layer.shape} color={layer.color} flipX={layer.flipX} flipY={layer.flipY} />}
            {layer.type === "image" && (
              <image
                href={layer.src}
                x={-size.width / 2}
                y={-size.height / 2}
                width={size.width}
                height={size.height}
                opacity={layer.opacity}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter: `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) ${layer.grayscale ? "grayscale(1)" : ""}`,
                }}
              />
            )}
          </LayerNode>
        );
      })}
    </>
  );
}
