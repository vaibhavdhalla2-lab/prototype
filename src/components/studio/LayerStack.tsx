import { useDesign, type DrawTool, type SmoothingLevel, type ImageLayer } from "../../lib/store";
import DrawLayer from "./DrawLayer";
import LayerNode from "./LayerNode";
import TextLayerRenderer, { estimateTextSize } from "./TextLayerRenderer";
import ShapeRenderer, { GRAPHIC_BASE } from "./ShapeRenderer";

export type CanvasMode = "move" | "draw" | "none";

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
export default function LayerStack({ side, printArea, mode, eraseColor, drawTool, drawColor, drawWidth, drawOpacity, smoothing }: LayerStackProps) {
  const design = useDesign();
  const layers = design.layersFor(side);

  return (
    <>
      {layers.map((layer) => {
        if (layer.type === "drawing") {
          return (
            <DrawLayer
              key={layer.id}
              strokes={layer.strokes}
              interactive={mode === "draw" && layer.visible && !layer.locked}
              tool={drawTool}
              color={drawColor}
              eraseColor={eraseColor}
              widthOverride={drawWidth}
              opacityOverride={drawOpacity}
              smoothing={smoothing}
              refined={layer.refined}
              printArea={printArea}
              onStrokeEnd={(s) => design.addStroke(side, s)}
            />
          );
        }
        if (!layer.visible) return null;
        const selected = design.selectedLayerId === layer.id;
        const interactive = mode === "move";
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
