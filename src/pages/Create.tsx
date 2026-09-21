import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDesign } from "../lib/store";
import type { DrawTool, SmoothingLevel } from "../lib/store";
import { colorById, materialById, type GarmentType } from "../data/catalog";
import { isApparel, productById, type ProductId } from "../data/products";
import ProductStage, { printAreaFor, hasSecondaryView, secondaryViewLabel, primaryViewLabel } from "../components/products/ProductStage";
import { track } from "../lib/analytics";
import { checkManufacturability, contextualTip } from "../lib/muse";

import GradientMesh from "../components/GradientMesh";
import PrototypeNotice from "../components/PrototypeNotice";
import CanvasPicker from "../components/studio/CanvasPicker";
import EntryUpload from "../components/studio/EntryUpload";
import EntryPrompt from "../components/studio/EntryPrompt";
import GiftFlow from "../components/studio/GiftFlow";
import ProductSwitcher from "../components/studio/ProductSwitcher";
import ColorSwatchRow from "../components/studio/ColorSwatchRow";
import DeviceSelector from "../components/studio/DeviceSelector";
import ColorPanel from "../components/studio/ColorPanel";
import MaterialPanel from "../components/studio/MaterialPanel";
import FitPanel from "../components/studio/FitPanel";
import OptionsPanel from "../components/studio/OptionsPanel";
import TextPanel from "../components/studio/TextPanel";
import ImagePanel from "../components/studio/ImagePanel";
import DrawPanel from "../components/studio/DrawPanel";
import DetailsPanel from "../components/studio/DetailsPanel";
import GraphicsPanel from "../components/studio/GraphicsPanel";
import LayersPanel from "../components/studio/LayersPanel";
import SummaryPanel from "../components/studio/SummaryPanel";
import MusePanel from "../components/studio/MusePanel";
import LayerStack, { type CanvasMode } from "../components/studio/LayerStack";
import { MagnifierLens, MagnifiedView, lensToRegion, DEFAULT_ZOOM, type LensPos, type PrecisionCursorMode } from "../components/studio/Magnifier";
import BottomSheet from "../components/studio/BottomSheet";
import RefineDrawing from "../components/studio/RefineDrawing";
import { IconSparkle, IconArrowRight, IconClose, IconPencil, IconType, IconUpload, IconLayers, IconMove, IconStore } from "../components/icons";
import { IconMaximize, IconHand } from "../components/icons";

type Stage = "pick" | "upload" | "prompt" | "gift" | "studio";
type ViewTab = "front" | "back" | "detail" | "3d" | "wrap";

interface TabDef {
  id: string;
  label: string;
  groupKeys?: string[];
}

/**
 * Colour is shown centered directly under the main product preview (see
 * ColorSwatchRow), not as a sidebar tab a user has to go find — so "color" is
 * deliberately left out of every list below. Layer management lives inside
 * the Design panel as a compact expandable control instead of its own
 * top-level tab, for the same reason.
 */
function leftPanelTabsFor(product: ProductId, apparel: boolean): TabDef[] {
  if (apparel) {
    return [
      { id: "design", label: "Design" },
      { id: "material", label: "Material" },
      { id: "fit", label: "Fit" },
      { id: "details", label: "Details" },
    ];
  } else if (product === "mug") {
    return [
      { id: "design", label: "Design" },
      { id: "material", label: "Material", groupKeys: ["material"] },
      { id: "finish", label: "Finish", groupKeys: ["finish"] },
      { id: "size", label: "Size", groupKeys: ["size"] },
      { id: "details", label: "Details" },
    ];
  } else if (product === "poster") {
    return [
      { id: "design", label: "Design" },
      { id: "size-orientation", label: "Size & Orientation", groupKeys: ["orientation", "size"] },
      { id: "paper", label: "Paper", groupKeys: ["paper"] },
      { id: "frame", label: "Frame", groupKeys: ["frame"] },
      { id: "details", label: "Details" },
    ];
  } else if (product === "bottle") {
    return [
      { id: "design", label: "Design" },
      { id: "material", label: "Material", groupKeys: ["material"] },
      { id: "capacity", label: "Capacity", groupKeys: ["capacity"] },
      { id: "lid", label: "Cap / Lid", groupKeys: ["lid"] },
      { id: "details", label: "Details" },
    ];
  } else if (product === "deskpad") {
    return [
      { id: "design", label: "Design" },
      { id: "size", label: "Size", groupKeys: ["size"] },
      { id: "surface", label: "Surface", groupKeys: ["surface"] },
      { id: "edge", label: "Edge", groupKeys: ["edge"] },
      { id: "base", label: "Base", groupKeys: ["base"] },
      { id: "details", label: "Details" },
    ];
  } else if (product === "phonecase") {
    return [
      { id: "device", label: "Device", groupKeys: ["model"] },
      { id: "design", label: "Design" },
      { id: "casetype", label: "Case Type", groupKeys: ["type"] },
      { id: "finish", label: "Finish", groupKeys: ["finish"] },
      { id: "details", label: "Details" },
    ];
  }
  return [
    { id: "design", label: "Design" },
    { id: "details", label: "Details" },
  ];
}

function initialCategoryFor(product: ProductId): string {
  return product === "phonecase" ? "device" : "design";
}

type DesignSub = "move" | "image" | "draw" | "text" | "graphics";

const DESIGN_SUB_TABS: { id: DesignSub; label: string; icon: typeof IconPencil }[] = [
  { id: "move", label: "Move", icon: IconMove },
  { id: "image", label: "Upload", icon: IconUpload },
  { id: "draw", label: "Draw", icon: IconPencil },
  { id: "text", label: "Text", icon: IconType },
  { id: "graphics", label: "Graphics", icon: IconLayers },
];

export default function Create() {
  const design = useDesign();
  const location = useLocation();
  const initialized = useRef(false);

  const [stage, setStage] = useState<Stage>("studio");
  const [promptPrefill, setPromptPrefill] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string>("design");
  const [designSub, setDesignSub] = useState<DesignSub>("move");
  const [drawTool, setDrawTool] = useState<DrawTool>("marker");
  const [drawColor, setDrawColor] = useState("#1a1712");
  const [drawBrushSize, setDrawBrushSize] = useState(7);
  const [drawOpacity, setDrawOpacity] = useState(0.95);
  const [drawSmoothing, setDrawSmoothing] = useState<SmoothingLevel>("none");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [zoomed, setZoomed] = useState(false);
  const [wrapView, setWrapView] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [precisionHintDismissed, setPrecisionHintDismissed] = useState(() => {
    try {
      return window.localStorage.getItem("forme_precision_hint_seen") === "1";
    } catch {
      return false;
    }
  });
  const [lens, setLens] = useState<LensPos>({ x: 0.5, y: 0.42, size: 0.32 });
  const [lensZoom, setLensZoom] = useState(DEFAULT_ZOOM);
  const [productSettingsOpen, setProductSettingsOpen] = useState(false);
  const [musePrefill, setMusePrefill] = useState<string | null>(null);
  const [museSheetOpen, setMuseSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [refiningOpen, setRefiningOpen] = useState(false);

  const setDrawColorTracked = (c: string) => {
    setDrawColor(c);
    setRecentColors((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 6));
  };

  const closeAllSheets = () => {
    setProductSheetOpen(false);
    setSheetOpen(false);
    setMuseSheetOpen(false);
  };

  const askMuse = (prompt: string) => {
    setMusePrefill(prompt);
    closeAllSheets();
    setMuseSheetOpen(true);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const mode = (location.state as { mode?: string } | null)?.mode;
    const prefillText = (location.state as { prefillText?: string } | null)?.prefillText;
    if (prefillText) setPromptPrefill(prefillText);

    if (mode === "remix" || design.sourceMode === "remix") {
      setStage("studio");
      return;
    }
    if (mode === "scratch") {
      design.startFresh();
      design.setSourceMode("scratch");
      setStage("pick");
      return;
    }
    if (mode === "upload") {
      design.startFresh();
      design.setSourceMode("upload");
      setStage("upload");
      return;
    }
    if (mode === "prompt") {
      design.startFresh();
      design.setSourceMode("prompt");
      setStage("prompt");
      return;
    }
    if (mode === "gift") {
      design.startFresh();
      setStage("gift");
      return;
    }
    setStage(design.garment ? "studio" : "pick");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  useEffect(() => {
    if (stage !== "studio") return;
    document.documentElement.classList.add("studio-active");
    return () => document.documentElement.classList.remove("studio-active");
  }, [stage]);

  useEffect(() => {
    if (!design.garment) return;
    const validIds = leftPanelTabsFor(design.garment, isApparel(design.garment)).map((t) => t.id);
    setCategory((c) => (validIds.includes(c) ? c : initialCategoryFor(design.garment!)));
    setWrapView(false);
    setZoomed(false);
    setInspecting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.garment]);

  const selectView = (tab: ViewTab) => {
    if (tab === "wrap") {
      setWrapView(true);
      setZoomed(false);
      return;
    }
    setWrapView(false);
    if (tab === "detail") {
      design.setView("front");
      setZoomed(true);
    } else {
      design.setView(tab as "front" | "back" | "3d");
      setZoomed(false);
    }
  };
  const activeViewTab: ViewTab = wrapView ? "wrap" : zoomed ? "detail" : design.view;

  const jump = (cat: string, sub?: string) => {
    setCategory(cat);
    if (sub) setDesignSub(sub as DesignSub);
    closeAllSheets();
    setSheetOpen(true);
    setReviewOpen(false);
  };

  if (stage === "pick") {
    return (
      <CanvasPicker
        onSelectProduct={(g) => {
          design.setGarment(g);
          track("garment_selected", { garment: g });
          setStage("studio");
          setCategory(initialCategoryFor(g));
        }}
        onStartGift={() => setStage("gift")}
      />
    );
  }

  if (stage === "upload") {
    return (
      <EntryUpload
        onEnterStudio={() => {
          setStage("studio");
          setCategory("design");
          setDesignSub("image");
        }}
      />
    );
  }

  if (stage === "prompt") {
    return (
      <EntryPrompt
        initialText={promptPrefill}
        onEnterStudio={(tab) => {
          setStage("studio");
          setCategory(tab === "color" ? "color" : "design");
        }}
      />
    );
  }

  if (stage === "gift") {
    return (
      <GiftFlow
        onBack={() => setStage("pick")}
        onEnterStudio={(productId) => {
          design.setGarment(productId);
          track("garment_selected", { garment: productId, source: "gift" });
          setStage("studio");
          setCategory(initialCategoryFor(productId));
        }}
      />
    );
  }

  if (!design.garment) {
    return (
      <CanvasPicker
        onSelectProduct={(g) => {
          design.setGarment(g);
          setStage("studio");
          setCategory(initialCategoryFor(g));
        }}
        onStartGift={() => setStage("gift")}
      />
    );
  }

  const apparel = isApparel(design.garment);
  const apparelGarment = apparel ? (design.garment as GarmentType) : null;
  const colorHex = colorById(design.color).hex;
  const printArea = printAreaFor(design.garment, "front");
  const backPrintArea = printAreaFor(design.garment, "back");
  const activeSide = design.view === "back" ? "back" : "front";
  const activePrintArea = activeSide === "back" ? backPrintArea : printArea;

  const canvasMode: CanvasMode = !wrapView && (category === "design" || category === "layers") && !(inspecting && panMode)
    ? category === "design" && designSub === "draw"
      ? "draw"
      : category === "design" && designSub === "text"
        ? "text"
        : "move"
    : "none";

  const region = inspecting && !wrapView ? lensToRegion(lens, activePrintArea, activeSide) : null;
  const precisionCursorMode: PrecisionCursorMode = panMode
    ? "hand"
    : category === "design" && designSub === "draw"
      ? drawTool === "eraser"
        ? "erase"
        : "draw"
      : category === "design" && designSub === "text"
        ? "text"
        : "move";

  const exitPrecisionEdit = () => {
    setInspecting(false);
    setPanMode(false);
  };

  const onCreateText = (createSide: "front" | "back", x: number, y: number) => {
    design.addTextLayer(createSide, { content: "Type here", x, y });
  };

  const layerStackCommon = {
    drawTool,
    drawColor,
    drawWidth: drawBrushSize,
    drawOpacity,
    smoothing: drawSmoothing,
    eraseColor: colorHex,
    onCreateText,
  };

  const frontOverlay = (
    <g filter={design.finish === "embroidery" ? `url(#embroidery-${design.garment}-front)` : undefined}>
      <LayerStack side="front" printArea={printArea} mode={activeSide === "front" ? canvasMode : "none"} {...layerStackCommon} />
    </g>
  );
  const backOverlay = (
    <g filter={design.finish === "embroidery" ? `url(#embroidery-${design.garment}-back)` : undefined}>
      <LayerStack side="back" printArea={backPrintArea} mode={activeSide === "back" ? canvasMode : "none"} {...layerStackCommon} />
    </g>
  );

  const issue = apparelGarment ? checkManufacturability({ garment: apparelGarment, material: design.material, fit: design.fit, finish: design.finish }) : null;
  const tip = apparelGarment && !issue ? contextualTip({ garment: apparelGarment, material: design.material, fit: design.fit, finish: design.finish }) : null;

  const quickSave = () => {
    setSavedFlash(true);
    track("design_completed", { garment: design.garment, quick: true });
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const startRefine = () => {
    if (!apparel) return;
    const side = design.view === "back" ? "back" : "front";
    const strokes = side === "back" ? design.strokesBack : design.strokesFront;
    const alreadyRefined = side === "back" ? design.refinedBack : design.refinedFront;
    if (strokes.length > 0 && !alreadyRefined) setRefiningOpen(true);
  };

  const tabs = leftPanelTabsFor(design.garment, apparel);
  const activeTabDef = tabs.find((t) => t.id === category);

  const renderPanel = () => {
    if (category === "design") {
      if (designSub === "draw")
        return (
          <DrawPanel
            tool={drawTool}
            setTool={setDrawTool}
            color={drawColor}
            setColor={setDrawColorTracked}
            brushSize={drawBrushSize}
            setBrushSize={setDrawBrushSize}
            opacity={drawOpacity}
            setOpacity={setDrawOpacity}
            smoothing={drawSmoothing}
            setSmoothing={setDrawSmoothing}
            recentColors={recentColors}
            onRefine={startRefine}
          />
        );
      if (designSub === "text") return <TextPanel />;
      if (designSub === "image") return <ImagePanel />;
      if (designSub === "graphics") return <GraphicsPanel />;
      return (
        <div className="animate-fade-in text-sm text-ink-soft">
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">Move</p>
          <p className="mt-2">Tap anything already on the product to select it, then drag to move, use the corner handle to resize, or the top handle to rotate.</p>
          <p className="mt-3">Nothing here yet? Choose Upload, Draw, Text or Graphics above to add your first element.</p>
        </div>
      );
    }
    if (category === "material" && apparel) return <MaterialPanel onOpenMuse={() => askMuse("What material would work best for this design?")} />;
    if (category === "color") return <ColorPanel onAskMuse={askMuse} />;
    if (category === "fit" && apparel) return <FitPanel />;
    if (category === "details") return <DetailsPanel />;
    if (category === "device") return <DeviceSelector />;
    if (category === "layers")
      return (
        <div>
          <button onClick={() => setCategory("design")} className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink-soft">
            ← Design
          </button>
          <LayersPanel onAskMuse={askMuse} />
        </div>
      );
    if (activeTabDef?.groupKeys) return <OptionsPanel groupKeys={activeTabDef.groupKeys} title={activeTabDef.label} />;
    return null;
  };

  const IssueOrTip = issue ? (
    <div className="rounded-2xl border border-clay/40 bg-clay/[0.07] px-4 py-3 text-[13px] text-clay-deep">
      <p className="font-medium">⚠ Not currently available</p>
      <p className="mt-1 text-ink-soft">{issue.message}</p>
      <button
        onClick={() => design.setMaterial(issue.fixMaterial)}
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-clay-deep underline underline-offset-2"
      >
        Try this instead — {issue.fixLabel}
      </button>
    </div>
  ) : tip ? (
    <div className="flex items-start gap-2 rounded-2xl border border-line-soft bg-ivory-dim px-4 py-3 text-[13px] text-ink-soft">
      <IconSparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-deep" />
      <span>{tip}</span>
    </div>
  ) : null;

  const isMug = design.garment === "mug";
  const secondaryLabel = secondaryViewLabel(design.garment);
  const showSecondary = hasSecondaryView(design.garment);
  const viewTabs: { id: ViewTab; label: string }[] = apparel
    ? [
        { id: "front", label: "Front" },
        { id: "back", label: "Back" },
        { id: "detail", label: "Detail" },
        { id: "3d", label: "3D View" },
      ]
    : isMug
      ? [
          { id: "front", label: "Front" },
          { id: "back", label: "Back" },
          { id: "wrap", label: "Wraparound" },
        ]
      : showSecondary
        ? [
            { id: "front", label: primaryViewLabel(design.garment) },
            { id: "back", label: secondaryLabel },
          ]
        : [{ id: "front", label: primaryViewLabel(design.garment) }];

  const stageElement = (opts?: { forceFlat?: boolean }) => (
    <ProductStage
      product={design.garment!}
      colorHex={colorHex}
      view={wrapView ? "wrap" : design.view}
      variants={design.variants}
      fit={apparel ? design.fit : undefined}
      accentTrim={design.accentTrim}
      pocketVisible={design.pocketVisible}
      frontOverlay={frontOverlay}
      backOverlay={backOverlay}
      className="h-full w-full"
      forceFlat={opts?.forceFlat}
    />
  );

  const GarmentCard = ({ size }: { size: "sm" | "lg" }) => (
    <div
      className={`relative mx-auto w-full ${size === "lg" ? "max-w-[640px]" : "max-w-[420px]"} aspect-square rounded-[32px] border border-[#d4af70]/25 bg-paper shadow-[0_30px_80px_-45px_rgba(36,31,26,0.35)] grain`}
      style={{ overflow: zoomed ? "hidden" : "visible" }}
    >
      <div
        className="h-full w-full p-8 transition-transform duration-500 ease-out"
        style={{ transform: zoomed ? "scale(1.85)" : "scale(1)", transformOrigin: "56% 42%" }}
      >
        {stageElement()}
      </div>

      {!wrapView && <MagnifierLens lens={lens} onMove={setLens} printArea={activePrintArea} active={inspecting} />}

      {design.view === "3d" && !zoomed && !wrapView && (
        <p className="absolute left-1/2 top-4 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Drag to rotate</p>
      )}
    </div>
  );

  const caption = apparel
    ? `${productById(design.garment).label} · ${colorById(design.color).label} · ${materialById(design.material).label}`
    : `${productById(design.garment).label} · ${colorById(design.color).label}`;

  const ViewTabRow = () =>
    viewTabs.length < 2 ? null : (
      <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-line bg-paper p-1">
        {viewTabs.map((v) => (
          <button
            key={v.id}
            onClick={() => selectView(v.id)}
            className={`rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
              activeViewTab === v.id ? "bg-[#241f1a] text-[#d4af70]" : "text-ink-soft hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    );

  const PrecisionEditToggle = () => (
    <button
      onClick={() => {
        if (inspecting) {
          exitPrecisionEdit();
        } else {
          setInspecting(true);
          if (category !== "design" && category !== "layers") setCategory("design");
        }
      }}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
        inspecting ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line text-ink-soft hover:border-ink-soft"
      }`}
    >
      <IconMaximize className="h-3.5 w-3.5" />
      {inspecting ? "Editing Precisely" : "Precision Edit"}
    </button>
  );

  const selectPrecisionTool = (sub: DesignSub) => {
    setPanMode(false);
    setCategory("design");
    setDesignSub(sub);
  };

  /** The canvas-level tool switcher only — properties for whichever tool is active live in the left sidebar, not duplicated here. */
  const PrecisionToolTabs = () => (
    <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => setPanMode((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] transition-colors ${
          panMode ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line-soft text-ink-soft hover:border-ink-soft"
        }`}
      >
        <IconHand className="h-3.5 w-3.5" /> Hand
      </button>
      {DESIGN_SUB_TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => selectPrecisionTool(t.id)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] transition-colors ${
            !panMode && category === "design" && designSub === t.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line-soft text-ink-soft hover:border-ink-soft"
          }`}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </button>
      ))}
      <button
        onClick={() => {
          setPanMode(false);
          askMuse("");
        }}
        className="flex items-center gap-1.5 rounded-full border border-[#c8a96b]/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[#8f7345] hover:border-[#c8a96b]"
      >
        <IconSparkle className="h-3.5 w-3.5" /> MUSE
      </button>
    </div>
  );

  return (
    <div className="relative">
      <GradientMesh fixed className="opacity-70" />

      {/* ============================= DESKTOP (lg+) ============================= */}
      <div className="hidden lg:flex lg:h-[calc(100vh-73px)] lg:flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-line-soft px-6 py-2.5">
          <button
            onClick={() => {
              design.startFresh();
              setStage("pick");
            }}
            className="text-[11px] uppercase tracking-[0.18em] text-ink-faint hover:text-ink-soft"
          >
            ← Start Over
          </button>
          <PrototypeNotice compact />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — product config + summary, own scroll */}
          <div className="scrollbar-thin w-[300px] shrink-0 overflow-y-auto border-r border-line-soft px-5 py-6 xl:w-[320px]">
            <ProductSwitcher className="mb-5" />

            <div className="mb-5 rounded-2xl border border-line-soft bg-paper p-4">
              <SummaryPanel onJump={jump} previewFrontOverlay={frontOverlay} previewBackOverlay={backOverlay} />
            </div>

            <div className="flex flex-col gap-1.5">
              {(inspecting ? tabs.filter((t) => t.id === "design") : tabs).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCategory(t.id)}
                  className={`rounded-xl px-4 py-2.5 text-left text-[13px] font-medium uppercase tracking-[0.08em] transition-colors ${
                    category === t.id ? "bg-[#241f1a] text-[#d4af70]" : "text-ink-soft hover:bg-ivory-dim"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {inspecting && tabs.some((t) => t.id !== "design") && (
              <div className="mt-2 border-t border-line-soft pt-2">
                <button
                  onClick={() => setProductSettingsOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft"
                >
                  Product settings
                  <span className="text-[10px]">{productSettingsOpen ? "Hide" : "Show"}</span>
                </button>
                {productSettingsOpen && (
                  <div className="flex flex-col gap-1.5 px-1">
                    {tabs
                      .filter((t) => t.id !== "design")
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCategory(t.id)}
                          className={`rounded-xl px-4 py-2.5 text-left text-[13px] font-medium uppercase tracking-[0.08em] transition-colors ${
                            category === t.id ? "bg-[#241f1a] text-[#d4af70]" : "text-ink-soft hover:bg-ivory-dim"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {category === "design" && (
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {DESIGN_SUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDesignSub(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[9.5px] uppercase tracking-[0.02em] transition-colors ${
                      designSub === t.id ? "border-[#241f1a] text-[#241f1a]" : "border-line-soft text-ink-faint hover:border-ink-soft"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {category === "design" && (
              <button
                onClick={() => setCategory("layers")}
                className="mt-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink-soft"
              >
                <IconLayers className="h-3.5 w-3.5" /> Layers ▾
              </button>
            )}

            <div className="mt-4 rounded-3xl border border-line-soft bg-paper p-5">{renderPanel()}</div>
          </div>

          {/* CENTER — canvas, never scrolls */}
          <div className="flex flex-1 flex-col overflow-hidden px-8 py-5">
            {inspecting && !wrapView ? (
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.2em] text-[#8f7345]">Create / Precision Edit</p>
                    <p className="mt-0.5 text-[13px] font-medium text-ink">
                      {productById(design.garment).label} · {activeSide === "back" ? "Back" : "Front"}
                      {region ? ` · ${region.label}` : ""}
                    </p>
                  </div>
                  <button onClick={exitPrecisionEdit} className="rounded-full border border-line bg-paper px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft hover:border-ink-soft">
                    Done
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 gap-6">
                  {/* NAVIGATOR — chooses WHICH area to work on. Not for drawing. */}
                  <div className="flex w-[190px] shrink-0 flex-col xl:w-[220px]">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">Navigator</p>
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line-soft bg-paper p-4 shadow-[0_20px_50px_-35px_rgba(36,31,26,0.35)]">
                      {stageElement()}
                      <MagnifierLens lens={lens} onMove={setLens} printArea={activePrintArea} active />
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-ink-faint">Drag the box to choose an area · drag the corner to resize it.</p>
                  </div>

                  {/* PRECISION CANVAS — the large, actually-editable detail view. This is the hero. */}
                  <div className="flex min-h-0 flex-1 flex-col">
                    <PrecisionToolTabs />
                    <div className="min-h-0 flex-1">
                      <MagnifiedView
                        lens={lens}
                        zoom={lensZoom}
                        setZoom={setLensZoom}
                        renderStage={() => stageElement({ forceFlat: true })}
                        panelSize={520}
                        regionLabel={`${activeSide === "back" ? "Back" : "Front"}${region ? ` · ${region.label}` : ""} · ${lensZoom}×`}
                        cursorMode={precisionCursorMode}
                        brushSize={drawBrushSize}
                        onPan={panMode ? setLens : undefined}
                      />
                    </div>
                  </div>
                </div>

                {!precisionHintDismissed && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#17151a]/12 backdrop-blur-[1px]">
                    <div className="max-w-sm rounded-3xl border border-[#c8a96b]/30 bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(23,21,26,0.5)]">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f7345]">Precision Edit</p>
                      <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
                        <li>1. Drag the box in the Navigator to choose an area.</li>
                        <li>2. Zoom in on the Precision Canvas.</li>
                        <li>3. Draw, type, or ask MUSE to edit only that area.</li>
                      </ol>
                      <button
                        onClick={() => {
                          setPrecisionHintDismissed(true);
                          try {
                            window.localStorage.setItem("forme_precision_hint_seen", "1");
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="mt-4 w-full rounded-full bg-[#241f1a] py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#d4af70]"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div className="flex-1" />
                  <ViewTabRow />
                  <div className="flex flex-1 justify-end">{!wrapView && <PrecisionEditToggle />}</div>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center py-4">
                  <GarmentCard size="lg" />
                </div>
              </>
            )}

            <div className="shrink-0 pt-3 text-center">
              <p className="text-sm text-ink-soft">{caption}</p>
              {!inspecting && (
                <div className="mt-3">
                  <ColorSwatchRow />
                </div>
              )}
              {IssueOrTip && <div className="mx-auto mt-3 max-w-md">{IssueOrTip}</div>}
            </div>
          </div>

          {/* RIGHT — MUSE, full height, own scroll */}
          <div className="scrollbar-thin w-[360px] shrink-0 overflow-y-auto border-l border-line-soft bg-paper/40 px-5 py-6 xl:w-[400px]">
            <MusePanel inspecting={inspecting && !wrapView} region={region} prefill={musePrefill} onPrefillConsumed={() => setMusePrefill(null)} />
          </div>
        </div>
      </div>

      {/* ============================= MOBILE / TABLET (<lg) ============================= */}
      <div className="lg:hidden">
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line-soft bg-paper/95 px-4 py-3 backdrop-blur-md">
          <button
            onClick={() => {
              design.startFresh();
              setStage("pick");
            }}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft"
          >
            Back
          </button>
          <p className="font-display text-base text-ink">FORMÉ Create</p>
          <button onClick={quickSave} className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
            {savedFlash ? "Saved" : "Save"}
          </button>
        </div>

        <div className="px-4 pb-32 pt-16">
          <PrototypeNotice className="mb-4" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-full overflow-x-auto scrollbar-none">
              <div className="flex justify-center">
                <ViewTabRow />
              </div>
            </div>
            {!wrapView && <PrecisionEditToggle />}
          </div>
          <div className="mt-5">
            <GarmentCard size="sm" />
          </div>
          <p className="mt-4 text-center text-[13px] text-ink-soft">{caption}</p>
          <div className="mt-3">
            <ColorSwatchRow />
          </div>

          {IssueOrTip && <div className="mt-4">{IssueOrTip}</div>}

          <button
            onClick={() => setReviewOpen(true)}
            className="mt-5 flex w-full items-center justify-between rounded-2xl bg-[#c8a96b] px-5 py-4 text-[#241f1a]"
          >
            <span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[#241f1a]/60">Ready?</span>
              <span className="font-display text-xl">Review &amp; Finish</span>
            </span>
            <IconArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* bottom nav — Product / Tools / MUSE */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line-soft bg-paper/95 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-md">
          <button
            onClick={() => {
              const next = !productSheetOpen;
              closeAllSheets();
              setProductSheetOpen(next);
            }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-ink-soft"
          >
            <IconStore className="h-5 w-5" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.06em]">Product</span>
          </button>
          <button
            onClick={() => {
              const next = !sheetOpen;
              closeAllSheets();
              setSheetOpen(next);
            }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-ink-soft"
          >
            <IconPencil className="h-5 w-5" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.06em]">Tools</span>
          </button>
          <button
            onClick={() => {
              const next = !museSheetOpen;
              closeAllSheets();
              setMuseSheetOpen(next);
            }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[#8f7345]"
          >
            <IconSparkle className="h-5 w-5" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.06em]">MUSE</span>
          </button>
        </div>

        <BottomSheet open={productSheetOpen} title="Product" onClose={() => setProductSheetOpen(false)}>
          <ProductSwitcher className="mb-5" />
          <SummaryPanel onJump={jump} previewFrontOverlay={frontOverlay} previewBackOverlay={backOverlay} />
        </BottomSheet>

        <BottomSheet
          open={sheetOpen && !(category === "design" && designSub === "draw")}
          title={
            category === "design"
              ? `Design · ${DESIGN_SUB_TABS.find((t) => t.id === designSub)!.label}`
              : category === "layers"
                ? "Layers"
                : category === "color"
                  ? "Colour"
                  : (tabs.find((t) => t.id === category)?.label ?? "Tools")
          }
          onClose={() => setSheetOpen(false)}
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setCategory(t.id)}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] transition-colors ${
                  category === t.id ? "border-[#241f1a] bg-[#241f1a] text-[#d4af70]" : "border-line-soft text-ink-soft"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {category === "design" && (
            <div className="mb-4 grid grid-cols-5 gap-1.5">
              {DESIGN_SUB_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDesignSub(t.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[9.5px] uppercase tracking-[0.03em] transition-colors ${
                    designSub === t.id ? "border-[#241f1a] text-[#241f1a]" : "border-line-soft text-ink-faint hover:border-ink-soft"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {renderPanel()}
        </BottomSheet>

        {/* dedicated full-canvas drawing mode */}
        {sheetOpen && category === "design" && designSub === "draw" && (
          <div className="fixed inset-0 z-50 flex flex-col bg-ivory animate-fade-in">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Draw on the {productById(design.garment).label.toLowerCase()}</p>
              <button
                onClick={() => {
                  const side = design.view === "back" ? "back" : "front";
                  const strokes = side === "back" ? design.strokesBack : design.strokesFront;
                  const alreadyRefined = side === "back" ? design.refinedBack : design.refinedFront;
                  if (strokes.length > 0 && !alreadyRefined) startRefine();
                  else setSheetOpen(false);
                }}
                className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink"
              >
                Done
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
              <div className="relative aspect-square w-full max-w-[480px] rounded-[28px] border border-line-soft bg-paper p-6 shadow-[0_20px_60px_-30px_rgba(26,23,18,0.35)]">
                {stageElement()}
              </div>
            </div>
            <div className="max-h-[42vh] overflow-y-auto border-t border-line-soft px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
              <DrawPanel
                tool={drawTool}
                setTool={setDrawTool}
                color={drawColor}
                setColor={setDrawColorTracked}
                brushSize={drawBrushSize}
                setBrushSize={setDrawBrushSize}
                opacity={drawOpacity}
                setOpacity={setDrawOpacity}
                smoothing={drawSmoothing}
                setSmoothing={setDrawSmoothing}
                recentColors={recentColors}
              />
            </div>
          </div>
        )}

        {refiningOpen && apparelGarment && (
          <RefineDrawing
            garment={apparelGarment}
            colorHex={colorHex}
            side={design.view === "back" ? "back" : "front"}
            fit={design.fit}
            accentTrim={design.accentTrim}
            pocketVisible={design.pocketVisible}
            strokes={design.view === "back" ? design.strokesBack : design.strokesFront}
            printArea={design.view === "back" ? backPrintArea : printArea}
            onKeep={() => {
              design.setRefined(design.view === "back" ? "back" : "front", true);
              track("drawing_started", { action: "refined", side: design.view });
              setRefiningOpen(false);
              setSheetOpen(false);
            }}
            onEditAgain={() => setRefiningOpen(false)}
          />
        )}

        {/* Precision Edit — full-screen navigator (top) + precision canvas (below) on mobile */}
        {inspecting && !wrapView && (
          <div className="fixed inset-0 z-50 flex flex-col bg-ivory animate-fade-in">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f7345]">Create / Precision Edit</p>
                <p className="mt-0.5 text-[12.5px] font-medium text-ink">
                  {productById(design.garment).label} · {activeSide === "back" ? "Back" : "Front"}
                  {region ? ` · ${region.label}` : ""}
                </p>
              </div>
              <button onClick={exitPrecisionEdit} className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink">
                Done
              </button>
            </div>
            <div className="relative flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">Navigator — drag to choose an area, drag the corner to resize</p>
              <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-[24px] border border-line-soft bg-paper p-4 shadow-[0_20px_60px_-30px_rgba(26,23,18,0.35)]">
                {stageElement()}
                <MagnifierLens lens={lens} onMove={setLens} printArea={activePrintArea} active />
              </div>
              <div className="mt-5">
                <PrecisionToolTabs />
                <MagnifiedView
                  lens={lens}
                  zoom={lensZoom}
                  setZoom={setLensZoom}
                  renderStage={() => stageElement({ forceFlat: true })}
                  panelSize={320}
                  regionLabel={`${activeSide === "back" ? "Back" : "Front"}${region ? ` · ${region.label}` : ""} · ${lensZoom}×`}
                  cursorMode={precisionCursorMode}
                  brushSize={drawBrushSize}
                  onPan={panMode ? setLens : undefined}
                />
              </div>

              {!precisionHintDismissed && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#17151a]/12 p-4 backdrop-blur-[1px]">
                  <div className="max-w-sm rounded-3xl border border-[#c8a96b]/30 bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(23,21,26,0.5)]">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f7345]">Precision Edit</p>
                    <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
                      <li>1. Drag the box in the Navigator to choose an area.</li>
                      <li>2. Zoom in on the Precision Canvas.</li>
                      <li>3. Draw, type, or ask MUSE to edit only that area.</li>
                    </ol>
                    <button
                      onClick={() => {
                        setPrecisionHintDismissed(true);
                        try {
                          window.localStorage.setItem("forme_precision_hint_seen", "1");
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="mt-4 w-full rounded-full bg-[#241f1a] py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#d4af70]"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <BottomSheet open={museSheetOpen} title="MUSE" onClose={() => setMuseSheetOpen(false)}>
          <MusePanel inspecting={inspecting && !wrapView} region={region} prefill={musePrefill} onPrefillConsumed={() => setMusePrefill(null)} />
        </BottomSheet>

        {reviewOpen && (
          <div className="fixed inset-0 z-40 flex items-end bg-ink/30 backdrop-blur-sm animate-fade-in lg:hidden" onClick={() => setReviewOpen(false)}>
            <div
              className="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] border-t border-line-soft bg-paper px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4 shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="h-1 w-10 rounded-full bg-line" />
                <button onClick={() => setReviewOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft" aria-label="Close">
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              <SummaryPanel onJump={jump} previewFrontOverlay={frontOverlay} previewBackOverlay={backOverlay} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
