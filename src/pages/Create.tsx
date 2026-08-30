import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDesign } from "../lib/store";
import type { DrawTool } from "../lib/store";
import { colorById, garmentById, materialById } from "../data/catalog";
import { GarmentStage, PRINT_AREAS } from "../components/Garment";
import { track } from "../lib/analytics";
import { checkManufacturability, contextualTip } from "../lib/muse";

import CanvasPicker from "../components/studio/CanvasPicker";
import EntryUpload from "../components/studio/EntryUpload";
import EntryPrompt from "../components/studio/EntryPrompt";
import ColorPanel from "../components/studio/ColorPanel";
import MaterialPanel from "../components/studio/MaterialPanel";
import FitPanel from "../components/studio/FitPanel";
import TextPanel from "../components/studio/TextPanel";
import ImagePanel from "../components/studio/ImagePanel";
import DrawPanel from "../components/studio/DrawPanel";
import DetailsPanel from "../components/studio/DetailsPanel";
import GraphicsPanel from "../components/studio/GraphicsPanel";
import SummaryPanel from "../components/studio/SummaryPanel";
import MuseAssistant from "../components/studio/MuseAssistant";
import MusePanel from "../components/studio/MusePanel";
import BottomSheet from "../components/studio/BottomSheet";
import DrawLayer from "../components/studio/DrawLayer";
import ArtworkLayer from "../components/studio/ArtworkLayer";
import RefineDrawing from "../components/studio/RefineDrawing";
import { IconSparkle, IconArrowRight, IconClose, IconPencil, IconType, IconUpload, IconLayers } from "../components/icons";

type Stage = "pick" | "upload" | "prompt" | "studio";
type Category = "design" | "material" | "color" | "fit" | "details";
type DesignSub = "image" | "muse" | "draw" | "text" | "graphics";
type ViewTab = "front" | "back" | "detail" | "3d";

const CATEGORY_TABS: { id: Category; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "material", label: "Material" },
  { id: "color", label: "Colour" },
  { id: "fit", label: "Fit" },
  { id: "details", label: "Details" },
];

// Order matters: Image, Muse, Draw are the three primary creation methods —
// Text and Graphics remain available but secondary (reachable via "More").
const DESIGN_SUB_TABS: { id: DesignSub; label: string; icon: typeof IconPencil }[] = [
  { id: "image", label: "Image", icon: IconUpload },
  { id: "muse", label: "Muse", icon: IconSparkle },
  { id: "draw", label: "Draw", icon: IconPencil },
  { id: "text", label: "Text", icon: IconType },
  { id: "graphics", label: "Graphics", icon: IconLayers },
];

const PRIMARY_METHODS: { id: DesignSub; title: string; body: string; icon: typeof IconPencil }[] = [
  { id: "image", title: "Upload An Image", body: "Show us your inspiration or artwork.", icon: IconUpload },
  { id: "muse", title: "Tell MUSE", body: "Describe the aesthetic you're imagining.", icon: IconSparkle },
  { id: "draw", title: "Draw It", body: "Start with a blank canvas.", icon: IconPencil },
];

function DesignChooser({ onSelect }: { onSelect: (sub: DesignSub) => void }) {
  return (
    <div className="animate-fade-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-faint">How do you want to create?</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {PRIMARY_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[0_16px_36px_-24px_rgba(26,23,18,0.35)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-soft text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
              <m.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium text-ink">{m.title}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-soft">{m.body}</span>
            </span>
            <IconArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </div>
  );
}

function TextOverlay({
  content,
  placement,
  printArea,
  colorHex,
}: {
  content: string;
  placement: "top" | "center" | "bottom";
  printArea: { x: number; y: number; width: number; height: number };
  colorHex: string;
}) {
  const cx = printArea.x + printArea.width / 2;
  const cy = placement === "top" ? printArea.y + 14 : placement === "bottom" ? printArea.y + printArea.height - 6 : printArea.y + printArea.height / 2;
  return (
    <text x={cx} y={cy} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={600} fontSize="14" letterSpacing="2.5" fill={colorHex}>
      {content}
    </text>
  );
}

export default function Create() {
  const design = useDesign();
  const location = useLocation();
  const initialized = useRef(false);

  const [stage, setStage] = useState<Stage>("studio");
  const [category, setCategory] = useState<Category>("design");
  const [designSub, setDesignSub] = useState<DesignSub>("draw");
  const [designChooserOpen, setDesignChooserOpen] = useState(true);
  const [museOpen, setMuseOpen] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("marker");
  const [drawColor, setDrawColor] = useState("#1a1712");
  const [zoomed, setZoomed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [refiningOpen, setRefiningOpen] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const mode = (location.state as { mode?: string } | null)?.mode;

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
    setStage(design.garment ? "studio" : "pick");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  // hide the global mobile chrome (top header / bottom tab bar) while the studio is active
  useEffect(() => {
    if (stage !== "studio") return;
    document.documentElement.classList.add("studio-active");
    return () => document.documentElement.classList.remove("studio-active");
  }, [stage]);

  const selectView = (tab: ViewTab) => {
    if (tab === "detail") {
      design.setView("front");
      setZoomed(true);
    } else {
      design.setView(tab);
      setZoomed(false);
    }
  };
  const activeViewTab: ViewTab = zoomed ? "detail" : design.view;

  const jump = (cat: string, sub?: string) => {
    setCategory(cat as Category);
    if (sub) {
      setDesignSub(sub as DesignSub);
      setDesignChooserOpen(false);
    }
    setSheetOpen(true);
    setReviewOpen(false);
  };

  const openCategory = (cat: Category) => {
    setCategory(cat);
    setSheetOpen(true);
    setMoreOpen(false);
  };

  const drawExpanded = sheetOpen && category === "design" && designSub === "draw" && !designChooserOpen;

  if (stage === "pick") {
    return (
      <CanvasPicker
        onSelect={(g) => {
          design.setGarment(g);
          track("garment_selected", { garment: g });
          setStage("studio");
          setCategory("color");
        }}
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
          setDesignChooserOpen(false);
        }}
      />
    );
  }

  if (stage === "prompt") {
    return (
      <EntryPrompt
        onEnterStudio={(tab) => {
          setStage("studio");
          setCategory(tab === "color" ? "color" : "design");
          setDesignChooserOpen(false);
        }}
      />
    );
  }

  if (!design.garment) {
    return (
      <CanvasPicker
        onSelect={(g) => {
          design.setGarment(g);
          setStage("studio");
          setCategory("color");
        }}
      />
    );
  }

  const colorHex = colorById(design.color).hex;
  const printArea = PRINT_AREAS[design.garment].front;
  const backPrintArea = PRINT_AREAS[design.garment].back;
  const textColor = ["offwhite", "stone"].includes(design.color) ? "#1a1712" : "#f6f3ec";

  const frontContent = (
    <>
      <DrawLayer
        strokes={design.strokesFront}
        interactive={category === "design" && designSub === "draw" && design.view === "front"}
        tool={drawTool}
        color={drawColor}
        eraseColor={colorHex}
        refined={design.refinedFront}
        printArea={printArea}
        onStrokeEnd={(s) => {
          design.addStroke("front", s);
          track("drawing_started", { side: "front", tool: drawTool });
        }}
      />
      {design.artwork && (
        <ArtworkLayer
          artwork={design.artwork}
          printArea={printArea}
          interactive={category === "design" && designSub === "image"}
          onChange={(p) => design.setArtwork({ ...design.artwork!, ...p })}
        />
      )}
      {design.text?.content && <TextOverlay content={design.text.content} placement={design.text.placement} printArea={printArea} colorHex={textColor} />}
    </>
  );
  const backContent = (
    <DrawLayer
      strokes={design.strokesBack}
      interactive={category === "design" && designSub === "draw" && design.view === "back"}
      tool={drawTool}
      color={drawColor}
      eraseColor={colorHex}
      refined={design.refinedBack}
      printArea={backPrintArea}
      onStrokeEnd={(s) => {
        design.addStroke("back", s);
        track("drawing_started", { side: "back", tool: drawTool });
      }}
    />
  );

  const frontOverlay =
    design.finish === "embroidery" ? <g filter={`url(#embroidery-${design.garment}-front)`}>{frontContent}</g> : frontContent;
  const backOverlay =
    design.finish === "embroidery" ? <g filter={`url(#embroidery-${design.garment}-back)`}>{backContent}</g> : backContent;

  const issue = checkManufacturability({ garment: design.garment, material: design.material, fit: design.fit, finish: design.finish });
  const tip = !issue ? contextualTip({ garment: design.garment, material: design.material, fit: design.fit, finish: design.finish }) : null;

  const quickSave = () => {
    setSavedFlash(true);
    track("design_completed", { garment: design.garment, quick: true });
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const startRefine = () => {
    const side = design.view === "back" ? "back" : "front";
    const strokes = side === "back" ? design.strokesBack : design.strokesFront;
    const alreadyRefined = side === "back" ? design.refinedBack : design.refinedFront;
    if (strokes.length > 0 && !alreadyRefined) setRefiningOpen(true);
  };

  const renderPanel = () => {
    if (category === "design") {
      if (designSub === "draw") return <DrawPanel tool={drawTool} setTool={setDrawTool} color={drawColor} setColor={setDrawColor} onRefine={startRefine} />;
      if (designSub === "muse") return <MusePanel />;
      if (designSub === "text") return <TextPanel />;
      if (designSub === "image") return <ImagePanel />;
      return <GraphicsPanel />;
    }
    if (category === "material") return <MaterialPanel onOpenMuse={() => setMuseOpen(true)} />;
    if (category === "color") return <ColorPanel />;
    if (category === "fit") return <FitPanel />;
    return <DetailsPanel />;
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

  const viewTabs: { id: ViewTab; label: string }[] = [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
    { id: "detail", label: "Detail" },
    { id: "3d", label: "3D View" },
  ];

  const GarmentCard = ({ size }: { size: "sm" | "lg" }) => (
    <div
      className={`relative mx-auto w-full ${size === "lg" ? "max-w-[560px]" : "max-w-[420px]"} aspect-square rounded-[32px] border border-line-soft bg-paper shadow-[0_30px_80px_-45px_rgba(26,23,18,0.35)] grain`}
      style={{ overflow: zoomed ? "hidden" : "visible" }}
    >
      <div
        className="h-full w-full p-8 transition-transform duration-500 ease-out"
        style={{ transform: zoomed ? "scale(1.85)" : "scale(1)", transformOrigin: "56% 42%" }}
      >
        <GarmentStage
          garment={design.garment!}
          colorHex={colorHex}
          view={design.view}
          fit={design.fit}
          accentTrim={design.accentTrim}
          pocketVisible={design.pocketVisible}
          frontOverlay={frontOverlay}
          backOverlay={backOverlay}
          className="h-full w-full"
        />
      </div>

      <button
        onClick={() => setMuseOpen(true)}
        className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ivory shadow-[0_10px_30px_-10px_rgba(26,23,18,0.6)] transition-transform hover:-translate-y-0.5"
      >
        <IconSparkle className="h-3.5 w-3.5" />
        Muse
      </button>

      {design.view === "3d" && !zoomed && (
        <p className="absolute left-1/2 top-4 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Drag to rotate</p>
      )}
    </div>
  );

  const ViewTabRow = () => (
    <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-line bg-paper p-1">
      {viewTabs.map((v) => (
        <button
          key={v.id}
          onClick={() => selectView(v.id)}
          className={`rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
            activeViewTab === v.id ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="lg:mx-auto lg:max-w-[1500px] lg:px-5 lg:pb-16 lg:pt-10 xl:px-8">
      {/* ============================= DESKTOP (lg+) ============================= */}
      <div className="hidden lg:block">
        <div className="mb-8">
          <button
            onClick={() => {
              design.startFresh();
              setStage("pick");
            }}
            className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint hover:text-ink-soft"
          >
            ← Start Over
          </button>
          <h1 className="font-display text-4xl text-ink">FORMÉ Studio</h1>
          <p className="mt-1.5 max-w-md text-sm text-ink-soft">Your canvas. Your rules.</p>
        </div>

        <div className="grid grid-cols-[210px_1fr_280px] items-start gap-5 xl:grid-cols-[280px_1fr_360px] xl:gap-8">
          {/* LEFT: tools */}
          <div>
            <div className="flex flex-col gap-1.5">
              {CATEGORY_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCategory(t.id)}
                  className={`rounded-xl px-4 py-2.5 text-left text-[13px] font-medium uppercase tracking-[0.08em] transition-colors ${
                    category === t.id ? "bg-ink text-ivory" : "text-ink-soft hover:bg-ivory-dim"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {category === "design" && (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {DESIGN_SUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDesignSub(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] uppercase tracking-[0.04em] transition-colors ${
                      designSub === t.id ? "border-ink text-ink" : "border-line-soft text-ink-faint hover:border-ink-soft"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-3xl border border-line-soft bg-paper p-5 xl:p-6">{renderPanel()}</div>
          </div>

          {/* CENTER: garment */}
          <div>
            <ViewTabRow />
            <div className="mt-6">
              <GarmentCard size="lg" />
            </div>
            <p className="mt-5 text-center text-sm text-ink-soft">
              {garmentById(design.garment).label} · {colorById(design.color).label} · {materialById(design.material).label}
            </p>
            {IssueOrTip && <div className="mx-auto mt-5 max-w-md">{IssueOrTip}</div>}
          </div>

          {/* RIGHT: muse / price / finish */}
          <div className="rounded-3xl border border-line-soft bg-paper p-5 xl:p-6">
            <button
              onClick={() => setMuseOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-clay/30 bg-clay/[0.06] px-4 py-3 text-left transition-colors hover:border-clay/55"
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-clay-deep">
                <IconSparkle className="h-4 w-4" />
                Ask MUSE
              </span>
              <IconArrowRight className="h-3.5 w-3.5 text-clay-deep" />
            </button>
            <div className="mt-6">
              <SummaryPanel onJump={jump} previewFrontOverlay={frontOverlay} previewBackOverlay={backOverlay} />
            </div>
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
          <p className="font-display text-base text-ink">FORMÉ Studio</p>
          <button onClick={quickSave} className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
            {savedFlash ? "Saved" : "Save"}
          </button>
        </div>

        <div className="px-4 pb-40 pt-16">
          <ViewTabRow />
          <div className="mt-5">
            <GarmentCard size="sm" />
          </div>
          <p className="mt-4 text-center text-[13px] text-ink-soft">
            {garmentById(design.garment).label} · {colorById(design.color).label} · {materialById(design.material).label}
          </p>

          {IssueOrTip && <div className="mt-4">{IssueOrTip}</div>}

          <button
            onClick={() => setReviewOpen(true)}
            className="mt-5 flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-4 text-ivory"
          >
            <span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-ivory/60">Ready?</span>
              <span className="font-display text-xl">Review &amp; Finish</span>
            </span>
            <IconArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* bottom toolbar */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line-soft bg-paper/95 px-1 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur-md">
          {(["design", "material", "color", "fit"] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => openCategory(c)}
              className={`flex-1 rounded-xl py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.06em] transition-colors ${
                sheetOpen && category === c ? "bg-ivory-dim text-ink" : "text-ink-soft"
              }`}
            >
              {CATEGORY_TABS.find((t) => t.id === c)!.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMoreOpen(true);
              setSheetOpen(false);
            }}
            className={`flex-1 rounded-xl py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.06em] transition-colors ${
              category === "details" && sheetOpen ? "bg-ivory-dim text-ink" : "text-ink-soft"
            }`}
          >
            More
          </button>
        </div>

        <BottomSheet
          open={sheetOpen && !drawExpanded}
          title={
            category === "design"
              ? designChooserOpen
                ? "Design"
                : `Design · ${DESIGN_SUB_TABS.find((t) => t.id === designSub)!.label}`
              : CATEGORY_TABS.find((t) => t.id === category)!.label
          }
          onClose={() => setSheetOpen(false)}
        >
          {category === "design" ? (
            designChooserOpen ? (
              <DesignChooser
                onSelect={(sub) => {
                  setDesignSub(sub);
                  setDesignChooserOpen(false);
                }}
              />
            ) : (
              <div className="animate-fade-in">
                <button
                  onClick={() => setDesignChooserOpen(true)}
                  className="mb-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft"
                >
                  ← Change method
                </button>
                {renderPanel()}
              </div>
            )
          ) : (
            renderPanel()
          )}
        </BottomSheet>

        {/* dedicated full-canvas drawing mode — the garment stays large while you draw */}
        {drawExpanded && (
          <div className="fixed inset-0 z-50 flex flex-col bg-ivory animate-fade-in">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Draw on the garment</p>
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
                <GarmentStage
                  garment={design.garment!}
                  colorHex={colorHex}
                  view={design.view === "back" ? "back" : "front"}
                  fit={design.fit}
                  accentTrim={design.accentTrim}
                  pocketVisible={design.pocketVisible}
                  frontOverlay={frontOverlay}
                  backOverlay={backOverlay}
                  className="h-full w-full"
                />
              </div>
            </div>
            <div className="max-h-[42vh] overflow-y-auto border-t border-line-soft px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
              <DrawPanel tool={drawTool} setTool={setDrawTool} color={drawColor} setColor={setDrawColor} />
            </div>
          </div>
        )}

        {refiningOpen && design.garment && (
          <RefineDrawing
            garment={design.garment}
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

        <BottomSheet open={moreOpen} title="More tools" onClose={() => setMoreOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "design" as Category, sub: "text" as DesignSub, label: "Text", icon: IconType },
              { id: "design" as Category, sub: "graphics" as DesignSub, label: "Graphics", icon: IconLayers },
              { id: "details" as Category, sub: undefined, label: "Details", icon: IconSparkle },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setCategory(item.id);
                  if (item.sub) {
                    setDesignSub(item.sub);
                    setDesignChooserOpen(false);
                  }
                  setMoreOpen(false);
                  setSheetOpen(true);
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line py-6 text-ink-soft"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[11px] uppercase tracking-[0.08em]">{item.label}</span>
              </button>
            ))}
          </div>
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

      <MuseAssistant open={museOpen} onClose={() => setMuseOpen(false)} />
    </div>
  );
}
