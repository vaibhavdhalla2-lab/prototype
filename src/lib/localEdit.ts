import type { ShapeId } from "./shapes";

/**
 * A deterministic, keyword-driven interpreter for MUSE's local (magnifier-
 * region) edits. This is what makes "MUSE must update ONLY the selected
 * region, not regenerate the entire design" concrete: every action here
 * either adds one new, small, region-scoped layer, or tweaks/removes
 * whatever already exists inside that region — it never touches anything
 * outside the selection.
 */
export type LocalEditAction =
  | { type: "addText"; content: string; color?: string }
  | { type: "addGraphic"; shape: ShapeId; color?: string }
  | { type: "removeInRegion" }
  | { type: "tweakInRegion"; grayscale?: boolean; brightness?: number };

export interface LocalEditResult {
  action: LocalEditAction;
  summary: string;
}

function colorFromPrompt(p: string): string | undefined {
  if (/gold|champagne/.test(p)) return "#c8a96b";
  if (/red|crimson/.test(p)) return "#5a2331";
  if (/black|dark(?!er)/.test(p)) return "#1a1712";
  if (/white|cream|ivory/.test(p)) return "#f1ead9";
  if (/green|forest/.test(p)) return "#2f3d2e";
  if (/blue|navy/.test(p)) return "#232d3f";
  if (/bronze/.test(p)) return "#9a6a43";
  return undefined;
}

export function interpretLocalEdit(prompt: string): LocalEditResult {
  const p = prompt.toLowerCase();
  const quoted = prompt.match(/["'‘’“”]([^"'‘’“”]{1,40})["'‘’“”]/);
  const color = colorFromPrompt(p);

  if (/(remove|delete|erase|clear)\b/.test(p)) {
    return { action: { type: "removeInRegion" }, summary: "Removed whatever was in this area." };
  }
  if (/distress|grain|grungy|worn|faded|darker/.test(p)) {
    return {
      action: { type: "tweakInRegion", grayscale: /distress|grain|grungy|worn|faded/.test(p), brightness: /darker/.test(p) ? 82 : undefined },
      summary: "Applied a worn, textured treatment to this area.",
    };
  }
  if (/stripe|racing.?line/.test(p)) {
    return { action: { type: "addGraphic", shape: "line", color }, summary: "Added a thin stripe across this area." };
  }
  if (/\bstar\b/.test(p)) {
    return { action: { type: "addGraphic", shape: "star", color }, summary: "Added a small star to this area." };
  }
  if (/circle|dot\b/.test(p)) {
    return { action: { type: "addGraphic", shape: "circle", color }, summary: "Added a circular mark to this area." };
  }
  if (/flower|blob|organic|hand.?drawn/.test(p)) {
    return { action: { type: "addGraphic", shape: "blob", color }, summary: "Added a small hand-drawn-style mark to this area." };
  }
  if (/arrow/.test(p)) {
    return { action: { type: "addGraphic", shape: "arrow", color }, summary: "Added a small arrow mark to this area." };
  }
  if (quoted || /write|text|letter|initial|monogram|typograph|stitch|lettering|embroider/.test(p)) {
    const content = quoted ? quoted[1].toUpperCase() : /initial/.test(p) ? "A · B" : /stitch|embroider/.test(p) ? "· · ·" : "FORMÉ";
    return { action: { type: "addText", content, color }, summary: `Added "${content}" in small type to this area.` };
  }

  return { action: { type: "addGraphic", shape: "blob", color }, summary: "Added a small decorative mark to this area." };
}
