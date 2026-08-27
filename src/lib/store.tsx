import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  type ColorId,
  type FitId,
  type GarmentType,
  type MaterialId,
  type ViewMode,
  materialsFor,
  fitsFor,
} from "../data/catalog";
import type { MarketDesign } from "../data/marketplace";

export interface ArtworkState {
  src: string;
  x: number; // 0-1 relative to print area
  y: number;
  scale: number;
  rotation: number;
}

export type TextPlacement = "top" | "center" | "bottom";

export interface TextState {
  content: string;
  placement: TextPlacement;
}

export type DrawTool = "marker" | "pencil" | "brush" | "eraser";
export type GarmentSide = "front" | "back";

export interface DrawStroke {
  id: string;
  d: string;
  color: string;
  width: number;
  opacity: number;
}

export type SourceMode = "scratch" | "upload" | "prompt" | "remix" | null;
export type Finish = "print" | "embroidery";

export interface DesignState {
  name: string;
  garment: GarmentType | null;
  view: ViewMode;
  color: ColorId;
  material: MaterialId;
  fit: FitId;
  artwork: ArtworkState | null;
  strokesFront: DrawStroke[];
  strokesBack: DrawStroke[];
  text: TextState | null;
  sourceMode: SourceMode;
  remixOf: string | null;
  accentTrim: boolean;
  finish: Finish;
  pocketVisible: boolean;
}

const DEFAULT_STATE: DesignState = {
  name: "Untitled Creation",
  garment: null,
  view: "front",
  color: "offwhite",
  material: "lightweight-cotton",
  fit: "regular",
  artwork: null,
  strokesFront: [],
  strokesBack: [],
  text: null,
  sourceMode: null,
  remixOf: null,
  accentTrim: false,
  finish: "print",
  pocketVisible: true,
};

interface DesignStore extends DesignState {
  setGarment: (g: GarmentType) => void;
  setView: (v: ViewMode) => void;
  setColor: (c: ColorId) => void;
  setMaterial: (m: MaterialId) => void;
  setFit: (f: FitId) => void;
  setArtwork: (a: ArtworkState | null) => void;
  setText: (t: TextState | null) => void;
  addStroke: (side: GarmentSide, stroke: DrawStroke) => void;
  undoStroke: (side: GarmentSide) => void;
  redoStroke: (side: GarmentSide) => void;
  clearStrokes: (side: GarmentSide) => void;
  canUndo: (side: GarmentSide) => boolean;
  canRedo: (side: GarmentSide) => boolean;
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

  const setGarment = useCallback((g: GarmentType) => {
    setState((s) => {
      const mats = materialsFor(g);
      const fits = fitsFor(g);
      return {
        ...s,
        garment: g,
        material: mats.some((m) => m.id === s.material) ? s.material : mats[0].id,
        fit: fits.some((f) => f.id === s.fit) ? s.fit : fits[0].id,
      };
    });
  }, []);

  const setView = useCallback((v: ViewMode) => setState((s) => ({ ...s, view: v })), []);
  const setColor = useCallback((c: ColorId) => setState((s) => ({ ...s, color: c })), []);
  const setMaterial = useCallback((m: MaterialId) => setState((s) => ({ ...s, material: m })), []);
  const setFit = useCallback((f: FitId) => setState((s) => ({ ...s, fit: f })), []);
  const setArtwork = useCallback((a: ArtworkState | null) => setState((s) => ({ ...s, artwork: a })), []);
  const setText = useCallback((t: TextState | null) => setState((s) => ({ ...s, text: t })), []);
  const setName = useCallback((n: string) => setState((s) => ({ ...s, name: n })), []);
  const setSourceMode = useCallback((m: SourceMode) => setState((s) => ({ ...s, sourceMode: m })), []);
  const setAccentTrim = useCallback((v: boolean) => setState((s) => ({ ...s, accentTrim: v })), []);
  const setFinish = useCallback((f: Finish) => setState((s) => ({ ...s, finish: f })), []);
  const setPocketVisible = useCallback((v: boolean) => setState((s) => ({ ...s, pocketVisible: v })), []);

  const addStroke = useCallback((side: GarmentSide, stroke: DrawStroke) => {
    setState((s) => (side === "front" ? { ...s, strokesFront: [...s.strokesFront, stroke] } : { ...s, strokesBack: [...s.strokesBack, stroke] }));
    if (side === "front") setRedoFront([]);
    else setRedoBack([]);
  }, []);

  const undoStroke = useCallback((side: GarmentSide) => {
    setState((s) => {
      const list = side === "front" ? s.strokesFront : s.strokesBack;
      if (list.length === 0) return s;
      const next = list.slice(0, -1);
      const removed = list[list.length - 1];
      if (side === "front") setRedoFront((r) => [...r, removed]);
      else setRedoBack((r) => [...r, removed]);
      return side === "front" ? { ...s, strokesFront: next } : { ...s, strokesBack: next };
    });
  }, []);

  const redoStroke = useCallback((side: GarmentSide) => {
    if (side === "front") {
      setRedoFront((r) => {
        if (r.length === 0) return r;
        const restored = r[r.length - 1];
        setState((s) => ({ ...s, strokesFront: [...s.strokesFront, restored] }));
        return r.slice(0, -1);
      });
    } else {
      setRedoBack((r) => {
        if (r.length === 0) return r;
        const restored = r[r.length - 1];
        setState((s) => ({ ...s, strokesBack: [...s.strokesBack, restored] }));
        return r.slice(0, -1);
      });
    }
  }, []);

  const clearStrokes = useCallback((side: GarmentSide) => {
    setState((s) => (side === "front" ? { ...s, strokesFront: [] } : { ...s, strokesBack: [] }));
    if (side === "front") setRedoFront([]);
    else setRedoBack([]);
  }, []);

  const canUndo = useCallback((side: GarmentSide) => (side === "front" ? state.strokesFront.length > 0 : state.strokesBack.length > 0), [state.strokesFront, state.strokesBack]);
  const canRedo = useCallback((side: GarmentSide) => (side === "front" ? redoFront.length > 0 : redoBack.length > 0), [redoFront, redoBack]);

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

  const value = useMemo<DesignStore>(
    () => ({
      ...state,
      setGarment,
      setView,
      setColor,
      setMaterial,
      setFit,
      setArtwork,
      setText,
      addStroke,
      undoStroke,
      redoStroke,
      clearStrokes,
      canUndo,
      canRedo,
      setName,
      setSourceMode,
      setAccentTrim,
      setFinish,
      setPocketVisible,
      startFresh,
      loadFromMarketDesign,
      applyPartial,
    }),
    [state, setGarment, setView, setColor, setMaterial, setFit, setArtwork, setText, addStroke, undoStroke, redoStroke, clearStrokes, canUndo, canRedo, setName, setSourceMode, setAccentTrim, setFinish, setPocketVisible, startFresh, loadFromMarketDesign, applyPartial],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}
