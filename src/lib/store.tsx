import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  type ColorId,
  type FitId,
  type MaterialId,
  type ViewMode,
  materialsFor,
  fitsFor,
} from "../data/catalog";
import { isApparel, defaultVariantsFor, type ProductId } from "../data/products";
import type { ShapeId } from "./shapes";
import type { MarketDesign } from "../data/marketplace";

/** Structured "describe a person" context captured by the Gift flow, carried into the studio so it can be shown/edited alongside the design. */
export interface GiftContext {
  recipientName: string;
  relationship: string;
  occasion: string;
  interests: string;
  personality: string;
  message: string;
}

export type DrawTool = "pencil" | "marker" | "brush" | "pen" | "eraser";
export type SmoothingLevel = "none" | "light" | "medium" | "strong";
export type GarmentSide = "front" | "back";
export type LayerSide = GarmentSide;

export interface DrawStroke {
  id: string;
  d: string;
  color: string;
  width: number;
  opacity: number;
}

/**
 * The unified layer model — every placed element (a freehand drawing, a text
 * block, an uploaded image, a placed shape) is one entry here. This is what
 * lets the Layers panel, the magnifier's local editor, and MUSE's "apply
 * only to this region" all work against one consistent idea of "the things
 * on this product" instead of three separate single-slot fields.
 */
export type LayerType = "drawing" | "text" | "image" | "graphic";

interface LayerBase {
  id: string;
  type: LayerType;
  side: LayerSide;
  name: string;
  visible: boolean;
  locked: boolean;
  /** Center position, 0..1 relative to the print area. Unused (kept at 0.5/0.5) for drawing layers, which occupy the whole print area themselves. */
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface DrawingLayer extends LayerBase {
  type: "drawing";
  strokes: DrawStroke[];
  refined: boolean;
}

export type TextAlign = "left" | "center" | "right";
export type CaseMode = "none" | "upper" | "lower";

export interface TextLayer extends LayerBase {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  caseMode: CaseMode;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  src: string;
  brightness: number; // 100 = neutral
  contrast: number; // 100 = neutral
  saturation: number; // 100 = neutral
  grayscale: boolean;
  naturalWidth: number;
  naturalHeight: number;
}

export interface GraphicLayer extends LayerBase {
  type: "graphic";
  shape: ShapeId;
  color: string;
  flipX: boolean;
  flipY: boolean;
}

export type Layer = DrawingLayer | TextLayer | ImageLayer | GraphicLayer;

export type SourceMode = "scratch" | "upload" | "prompt" | "remix" | null;
export type Finish = "print" | "embroidery";

/** One entry in MUSE's local edit history — what was asked, where, and what happened. */
export interface MuseHistoryEntry {
  id: string;
  prompt: string;
  scope: "product" | "region";
  regionLabel?: string;
  summary: string;
  layerId?: string;
  createdAt: number;
}

export interface DesignState {
  name: string;
  /** Any of the 6 FORMÉ products — apparel ids (tshirt/hoodie/cap) additionally use color/material/fit below; everything else uses `variants`. */
  garment: ProductId | null;
  view: ViewMode;
  color: ColorId;
  material: MaterialId;
  fit: FitId;
  /** Generic per-product variant choices (mug size/finish, poster orientation/frame, etc.) — keyed by VariantGroup.key from data/products.ts. */
  variants: Record<string, string>;
  layers: Layer[];
  selectedLayerId: string | null;
  museHistory: MuseHistoryEntry[];
  sourceMode: SourceMode;
  remixOf: string | null;
  accentTrim: boolean;
  finish: Finish;
  pocketVisible: boolean;
  /** Set when this design started from the Gift / Describe-a-Person flow. */
  giftContext: GiftContext | null;
}

const DEFAULT_STATE: DesignState = {
  name: "Untitled Creation",
  garment: null,
  view: "front",
  color: "offwhite",
  material: "lightweight-cotton",
  fit: "regular",
  variants: {},
  layers: [],
  selectedLayerId: null,
  museHistory: [],
  sourceMode: null,
  remixOf: null,
  accentTrim: false,
  finish: "print",
  pocketVisible: true,
  giftContext: null,
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const NEW_TEXT_DEFAULTS = {
  fontFamily: "Inter",
  fontSize: 24,
  fontWeight: 600,
  italic: false,
  underline: false,
  align: "center" as TextAlign,
  letterSpacing: 0,
  lineHeight: 1.2,
  color: "#1a1712",
  caseMode: "none" as CaseMode,
};

interface DesignStore extends DesignState {
  setGarment: (g: ProductId) => void;
  setView: (v: ViewMode) => void;
  setColor: (c: ColorId) => void;
  setMaterial: (m: MaterialId) => void;
  setFit: (f: FitId) => void;
  setVariant: (key: string, value: string) => void;
  setGiftContext: (g: GiftContext | null) => void;

  // Layer API — the single source of truth for everything placed on the product.
  addTextLayer: (side: LayerSide, patch?: Partial<Pick<TextLayer, "content" | "x" | "y" | "scale">>) => string;
  addImageLayer: (side: LayerSide, src: string, dims?: { naturalWidth: number; naturalHeight: number }, patch?: Partial<Pick<ImageLayer, "x" | "y" | "scale">>) => string;
  addGraphicLayer: (side: LayerSide, shape: ShapeId, color: string, patch?: Partial<Pick<GraphicLayer, "x" | "y" | "scale">>) => string;
  updateLayer: <L extends Layer>(id: string, patch: Partial<L>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, direction: "up" | "down") => void;
  setLayerVisible: (id: string, v: boolean) => void;
  setLayerLocked: (id: string, v: boolean) => void;
  selectLayer: (id: string | null) => void;
  layersFor: (side: LayerSide) => Layer[];

  /** Legacy convenience — used by simple "just put this one image on the design" flows (EntryUpload, marketplace remix seeding). */
  setArtwork: (src: string) => void;

  // Drawing — kept as the same per-side stroke API as before; internally backed by a single "drawing" layer per side.
  addStroke: (side: GarmentSide, stroke: DrawStroke) => void;
  undoStroke: (side: GarmentSide) => void;
  redoStroke: (side: GarmentSide) => void;
  clearStrokes: (side: GarmentSide) => void;
  canUndo: (side: GarmentSide) => boolean;
  canRedo: (side: GarmentSide) => boolean;
  setRefined: (side: GarmentSide, v: boolean) => void;
  strokesFront: DrawStroke[];
  strokesBack: DrawStroke[];
  refinedFront: boolean;
  refinedBack: boolean;

  addMuseHistory: (entry: Omit<MuseHistoryEntry, "id" | "createdAt">) => void;
  clearMuseHistory: () => void;

  setName: (n: string) => void;
  setSourceMode: (m: SourceMode) => void;
  setAccentTrim: (v: boolean) => void;
  setFinish: (f: Finish) => void;
  setPocketVisible: (v: boolean) => void;
  startFresh: () => void;
  loadFromMarketDesign: (d: MarketDesign) => void;
  applyPartial: (p: Partial<DesignState>) => void;
}

const DesignContext = createContext<DesignStore | null>(null);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DesignState>(DEFAULT_STATE);
  const [redoFront, setRedoFront] = useState<DrawStroke[]>([]);
  const [redoBack, setRedoBack] = useState<DrawStroke[]>([]);

  const setGarment = useCallback((g: ProductId) => {
    setState((s) => {
      if (!isApparel(g)) {
        return { ...s, garment: g, variants: defaultVariantsFor(g) };
      }
      const mats = materialsFor(g);
      const fits = fitsFor(g);
      return {
        ...s,
        garment: g,
        variants: {},
        material: mats.some((m) => m.id === s.material) ? s.material : mats[0].id,
        fit: fits.some((f) => f.id === s.fit) ? s.fit : fits[0].id,
      };
    });
  }, []);

  const setView = useCallback((v: ViewMode) => setState((s) => ({ ...s, view: v })), []);
  const setColor = useCallback((c: ColorId) => setState((s) => ({ ...s, color: c })), []);
  const setMaterial = useCallback((m: MaterialId) => setState((s) => ({ ...s, material: m })), []);
  const setFit = useCallback((f: FitId) => setState((s) => ({ ...s, fit: f })), []);
  const setVariant = useCallback((key: string, value: string) => setState((s) => ({ ...s, variants: { ...s.variants, [key]: value } })), []);
  const setGiftContext = useCallback((g: GiftContext | null) => setState((s) => ({ ...s, giftContext: g })), []);
  const setName = useCallback((n: string) => setState((s) => ({ ...s, name: n })), []);
  const setSourceMode = useCallback((m: SourceMode) => setState((s) => ({ ...s, sourceMode: m })), []);
  const setAccentTrim = useCallback((v: boolean) => setState((s) => ({ ...s, accentTrim: v })), []);
  const setFinish = useCallback((f: Finish) => setState((s) => ({ ...s, finish: f })), []);
  const setPocketVisible = useCallback((v: boolean) => setState((s) => ({ ...s, pocketVisible: v })), []);

  // ---- layer helpers -------------------------------------------------

  /** Small deterministic offset so successive additions don't stack in the exact same spot. */
  const scatterOffset = (side: LayerSide, layers: Layer[]) => {
    const count = layers.filter((l) => l.side === side && l.type !== "drawing").length;
    const step = (count % 4) * 0.05 - 0.075;
    return step;
  };

  const addTextLayer = useCallback((side: LayerSide, patch?: Partial<Pick<TextLayer, "content" | "x" | "y" | "scale">>) => {
    const id = uid("text");
    setState((s) => {
      const off = scatterOffset(side, s.layers);
      const layer: TextLayer = {
        id,
        type: "text",
        side,
        name: `Text — ${(patch?.content ?? "New text").slice(0, 18)}`,
        visible: true,
        locked: false,
        x: patch?.x ?? 0.5 + off,
        y: patch?.y ?? 0.5 + off,
        scale: patch?.scale ?? 1,
        rotation: 0,
        opacity: 1,
        content: patch?.content ?? "TYPE HERE",
        ...NEW_TEXT_DEFAULTS,
      };
      return { ...s, layers: [...s.layers, layer], selectedLayerId: id };
    });
    return id;
  }, []);

  const addImageLayer = useCallback(
    (side: LayerSide, src: string, dims?: { naturalWidth: number; naturalHeight: number }, patch?: Partial<Pick<ImageLayer, "x" | "y" | "scale">>) => {
      const id = uid("image");
      setState((s) => {
        const off = scatterOffset(side, s.layers);
        const layer: ImageLayer = {
          id,
          type: "image",
          side,
          name: "Image — uploaded",
          visible: true,
          locked: false,
          x: patch?.x ?? 0.5 + off,
          y: patch?.y ?? 0.5 + off,
          scale: patch?.scale ?? 1,
          rotation: 0,
          opacity: 1,
          src,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: false,
          naturalWidth: dims?.naturalWidth ?? 0,
          naturalHeight: dims?.naturalHeight ?? 0,
        };
        return { ...s, layers: [...s.layers, layer], selectedLayerId: id };
      });
      return id;
    },
    [],
  );

  const addGraphicLayer = useCallback((side: LayerSide, shape: ShapeId, color: string, patch?: Partial<Pick<GraphicLayer, "x" | "y" | "scale">>) => {
    const id = uid("graphic");
    setState((s) => {
      const off = scatterOffset(side, s.layers);
      const layer: GraphicLayer = {
        id,
        type: "graphic",
        side,
        name: `Graphic — ${shape[0].toUpperCase()}${shape.slice(1)}`,
        visible: true,
        locked: false,
        x: patch?.x ?? 0.5 + off,
        y: patch?.y ?? 0.5 + off,
        scale: patch?.scale ?? 1,
        rotation: 0,
        opacity: 1,
        shape,
        color,
        flipX: false,
        flipY: false,
      };
      return { ...s, layers: [...s.layers, layer], selectedLayerId: id };
    });
    return id;
  }, []);

  const updateLayer = useCallback(<L extends Layer>(id: string, patch: Partial<L>) => {
    setState((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setState((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id), selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId }));
  }, []);

  const duplicateLayer = useCallback((id: string) => {
    setState((s) => {
      const found = s.layers.find((l) => l.id === id);
      if (!found) return s;
      const copy: Layer = { ...found, id: uid(found.type), name: `${found.name} copy`, x: Math.min(0.92, found.x + 0.05), y: Math.min(0.92, found.y + 0.05) };
      return { ...s, layers: [...s.layers, copy], selectedLayerId: copy.id };
    });
  }, []);

  const reorderLayer = useCallback((id: string, direction: "up" | "down") => {
    setState((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx === -1) return s;
      const swapWith = direction === "up" ? idx + 1 : idx - 1;
      if (swapWith < 0 || swapWith >= s.layers.length) return s;
      const next = [...s.layers];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return { ...s, layers: next };
    });
  }, []);

  const setLayerVisible = useCallback((id: string, v: boolean) => updateLayer(id, { visible: v }), [updateLayer]);
  const setLayerLocked = useCallback((id: string, v: boolean) => updateLayer(id, { locked: v }), [updateLayer]);
  const selectLayer = useCallback((id: string | null) => setState((s) => ({ ...s, selectedLayerId: id })), []);
  const layersFor = useCallback((side: LayerSide) => state.layers.filter((l) => l.side === side), [state.layers]);

  // ---- drawing (backed by one "drawing" layer per side) --------------

  const findOrCreateDrawingLayer = (layers: Layer[], side: GarmentSide): { layer: DrawingLayer; layers: Layer[] } => {
    const existing = layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;
    if (existing) return { layer: existing, layers };
    const fresh: DrawingLayer = {
      id: uid("drawing"),
      type: "drawing",
      side,
      name: `Drawing — ${side === "front" ? "Front" : "Back"}`,
      visible: true,
      locked: false,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      strokes: [],
      refined: false,
    };
    return { layer: fresh, layers: [fresh, ...layers] };
  };

  const addStroke = useCallback((side: GarmentSide, stroke: DrawStroke) => {
    setState((s) => {
      const { layer, layers } = findOrCreateDrawingLayer(s.layers, side);
      const updated = layers.map((l) => (l.id === layer.id ? { ...layer, strokes: [...layer.strokes, stroke], refined: false } : l));
      return { ...s, layers: updated };
    });
    if (side === "front") setRedoFront([]);
    else setRedoBack([]);
  }, []);

  const setRefined = useCallback((side: GarmentSide, v: boolean) => {
    setState((s) => {
      const drawing = s.layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;
      if (!drawing) return s;
      return { ...s, layers: s.layers.map((l) => (l.id === drawing.id ? { ...drawing, refined: v } : l)) };
    });
  }, []);

  const undoStroke = useCallback((side: GarmentSide) => {
    setState((s) => {
      const drawing = s.layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;
      if (!drawing || drawing.strokes.length === 0) return s;
      const removed = drawing.strokes[drawing.strokes.length - 1];
      if (side === "front") setRedoFront((r) => [...r, removed]);
      else setRedoBack((r) => [...r, removed]);
      const next = drawing.strokes.slice(0, -1);
      return { ...s, layers: s.layers.map((l) => (l.id === drawing.id ? { ...drawing, strokes: next } : l)) };
    });
  }, []);

  const redoStroke = useCallback((side: GarmentSide) => {
    const redoList = side === "front" ? redoFront : redoBack;
    if (redoList.length === 0) return;
    const restored = redoList[redoList.length - 1];
    setState((s) => {
      const { layer, layers } = findOrCreateDrawingLayer(s.layers, side);
      const updated = layers.map((l) => (l.id === layer.id ? { ...layer, strokes: [...layer.strokes, restored] } : l));
      return { ...s, layers: updated };
    });
    if (side === "front") setRedoFront((r) => r.slice(0, -1));
    else setRedoBack((r) => r.slice(0, -1));
  }, [redoFront, redoBack]);

  const clearStrokes = useCallback((side: GarmentSide) => {
    setState((s) => {
      const drawing = s.layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;
      if (!drawing) return s;
      return { ...s, layers: s.layers.map((l) => (l.id === drawing.id ? { ...drawing, strokes: [], refined: false } : l)) };
    });
    if (side === "front") setRedoFront([]);
    else setRedoBack([]);
  }, []);

  const canUndo = useCallback(
    (side: GarmentSide) => {
      const drawing = state.layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;
      return (drawing?.strokes.length ?? 0) > 0;
    },
    [state.layers],
  );
  const canRedo = useCallback((side: GarmentSide) => (side === "front" ? redoFront.length > 0 : redoBack.length > 0), [redoFront, redoBack]);

  const setArtwork = useCallback(
    (src: string) => {
      addImageLayer("front", src);
    },
    [addImageLayer],
  );

  const addMuseHistory = useCallback((entry: Omit<MuseHistoryEntry, "id" | "createdAt">) => {
    setState((s) => ({ ...s, museHistory: [{ ...entry, id: uid("muse"), createdAt: Date.now() }, ...s.museHistory].slice(0, 30) }));
  }, []);
  const clearMuseHistory = useCallback(() => setState((s) => ({ ...s, museHistory: [] })), []);

  const startFresh = useCallback(() => {
    setState(DEFAULT_STATE);
    setRedoFront([]);
    setRedoBack([]);
  }, []);

  const loadFromMarketDesign = useCallback((d: MarketDesign) => {
    setState({
      ...DEFAULT_STATE,
      name: `${d.name} (Remix)`,
      garment: d.garment,
      color: d.color,
      material: d.material,
      fit: d.fit,
      sourceMode: "remix",
      remixOf: d.id,
    });
    setRedoFront([]);
    setRedoBack([]);
  }, []);

  const applyPartial = useCallback((p: Partial<DesignState>) => setState((s) => ({ ...s, ...p })), []);

  const drawingFor = (side: GarmentSide) => state.layers.find((l) => l.type === "drawing" && l.side === side) as DrawingLayer | undefined;

  const value = useMemo<DesignStore>(
    () => ({
      ...state,
      setGarment,
      setView,
      setColor,
      setMaterial,
      setFit,
      setVariant,
      setGiftContext,
      addTextLayer,
      addImageLayer,
      addGraphicLayer,
      updateLayer,
      removeLayer,
      duplicateLayer,
      reorderLayer,
      setLayerVisible,
      setLayerLocked,
      selectLayer,
      layersFor,
      setArtwork,
      addStroke,
      undoStroke,
      redoStroke,
      clearStrokes,
      canUndo,
      canRedo,
      setRefined,
      strokesFront: drawingFor("front")?.strokes ?? [],
      strokesBack: drawingFor("back")?.strokes ?? [],
      refinedFront: drawingFor("front")?.refined ?? false,
      refinedBack: drawingFor("back")?.refined ?? false,
      addMuseHistory,
      clearMuseHistory,
      setName,
      setSourceMode,
      setAccentTrim,
      setFinish,
      setPocketVisible,
      startFresh,
      loadFromMarketDesign,
      applyPartial,
    }),
    [
      state,
      setGarment,
      setView,
      setColor,
      setMaterial,
      setFit,
      setVariant,
      setGiftContext,
      addTextLayer,
      addImageLayer,
      addGraphicLayer,
      updateLayer,
      removeLayer,
      duplicateLayer,
      reorderLayer,
      setLayerVisible,
      setLayerLocked,
      selectLayer,
      layersFor,
      setArtwork,
      addStroke,
      undoStroke,
      redoStroke,
      clearStrokes,
      canUndo,
      canRedo,
      setRefined,
      addMuseHistory,
      clearMuseHistory,
      setName,
      setSourceMode,
      setAccentTrim,
      setFinish,
      setPocketVisible,
      startFresh,
      loadFromMarketDesign,
      applyPartial,
    ],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}
