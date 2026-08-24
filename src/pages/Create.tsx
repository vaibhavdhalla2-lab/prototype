import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDesign } from "../lib/store";
import type { DrawTool } from "../lib/store";
import { colorById, garmentById, materialById } from "../data/catalog";
import { GarmentStage, PRINT_AREAS } from "../components/Garment";
import { track } from "../lib/analytics";

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
import SummaryPanel from "../components/studio/SummaryPanel";
import MuseAssistant from "../components/studio/MuseAssistant";
import DrawLayer from "../components/studio/DrawLayer";
import ArtworkLayer from "../components/studio/ArtworkLayer";
import { IconSparkle } from "../components/icons";

type Stage = "pick" | "upload" | "prompt" | "studio";
type Tab = "design" | "material" | "color" | "fit" | "text" | "image" | "draw" | "details";

const TABS: { id: Tab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "material", label: "Material" },
  { id: "color", label: "Colour" },
  { id: "fit", label: "Fit" },
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "draw", label: "Draw" },
  { id: "details", label: "Details" },
];

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
  const [activeTab, setActiveTab] = useState<Tab>("design");
  const [museOpen, setMuseOpen] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("marker");
  const [drawColor, setDrawColor] = useState("#1a1712");

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

  if (stage === "pick") {
    return (
      <CanvasPicker
        onSelect={(g) => {
          design.setGarment(g);
          track("selected_garment", { garment: g });
          setStage("studio");
          setActiveTab("color");
        }}
      />
    );
  }

  if (stage === "upload") {
    return (
      <EntryUpload
        onEnterStudio={(tab) => {
          setStage("studio");
          setActiveTab(tab as Tab);
        }}
      />
    );
  }

  if (stage === "prompt") {
    return (
      <EntryPrompt
        onEnterStudio={(tab) => {
          setStage("studio");
          setActiveTab(tab as Tab);
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
          setActiveTab("color");
        }}
      />
    );
  }

  const colorHex = colorById(design.color).hex;
  const printArea = PRINT_AREAS[design.garment].front;
  const textColor = ["offwhite", "stone"].includes(design.color) ? "#1a1712" : "#f6f3ec";

  const frontOverlay = (
    <>
      <DrawLayer
        strokes={design.strokesFront}
        interactive={activeTab === "draw" && design.view === "front"}
        tool={drawTool}
        color={drawColor}
        eraseColor={colorHex}
        onStrokeEnd={(s) => {
          design.addStroke("front", s);
          track("used_drawing", { side: "front", tool: drawTool });
        }}
      />
      {design.artwork && (
        <ArtworkLayer
          artwork={design.artwork}
          printArea={printArea}
          interactive={activeTab === "image"}
          onChange={(p) => design.setArtwork({ ...design.artwork!, ...p })}
        />
      )}
      {design.text?.content && <TextOverlay content={design.text.content} placement={design.text.placement} printArea={printArea} colorHex={textColor} />}
    </>
  );

  const backOverlay = (
    <DrawLayer
      strokes={design.strokesBack}
      interactive={activeTab === "draw" && design.view === "back"}
      tool={drawTool}
      color={drawColor}
      eraseColor={colorHex}
      onStrokeEnd={(s) => {
        design.addStroke("back", s);
        track("used_drawing", { side: "back", tool: drawTool });
      }}
    />
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => {
              design.startFresh();
              setStage("pick");
            }}
            className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint hover:text-ink-soft"
          >
            ← Start Over
          </button>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {design.sourceMode === "remix" ? `Remixing "${design.name.replace(" (Remix)", "")}"` : "Create From Scratch"}
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-ink-soft">
            Start with a blank canvas. We'll help you turn your imagination into something real.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-10">
        {/* WORKSPACE */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-paper p-1 mx-auto w-fit">
            {(["front", "back", "3d"] as const).map((v) => (
              <button
                key={v}
                onClick={() => design.setView(v)}
                className={`rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  design.view === v ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink"
                }`}
              >
                {v === "3d" ? "3D View" : v}
              </button>
            ))}
          </div>

          <div className="relative mx-auto mt-6 aspect-square w-full max-w-[520px] rounded-[32px] border border-line-soft bg-paper p-8 shadow-[0_30px_80px_-45px_rgba(26,23,18,0.35)] grain">
            <GarmentStage
              garment={design.garment}
              colorHex={colorHex}
              view={design.view}
              fit={design.fit}
              accentTrim={design.accentTrim}
              frontOverlay={frontOverlay}
              backOverlay={backOverlay}
              className="h-full w-full"
            />

            <button
              onClick={() => setMuseOpen(true)}
              className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ivory shadow-[0_10px_30px_-10px_rgba(26,23,18,0.6)] transition-transform hover:-translate-y-0.5"
            >
              <IconSparkle className="h-3.5 w-3.5" />
              Muse
            </button>

            {design.view === "3d" && (
              <p className="absolute left-1/2 top-4 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Drag to rotate</p>
            )}
          </div>

          <p className="mt-5 text-center text-sm text-ink-soft">
            {garmentById(design.garment).label} · {colorById(design.color).label} · {materialById(design.material).label}
          </p>
        </div>

        {/* TOOLBAR */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11.5px] font-medium uppercase tracking-[0.1em] transition-colors ${
                  activeTab === t.id ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-line-soft bg-paper p-6 sm:p-7">
            {activeTab === "design" && <SummaryPanel onJump={(t) => setActiveTab(t as Tab)} />}
            {activeTab === "material" && <MaterialPanel onOpenMuse={() => setMuseOpen(true)} />}
            {activeTab === "color" && <ColorPanel />}
            {activeTab === "fit" && <FitPanel />}
            {activeTab === "text" && <TextPanel />}
            {activeTab === "image" && <ImagePanel />}
            {activeTab === "draw" && <DrawPanel tool={drawTool} setTool={setDrawTool} color={drawColor} setColor={setDrawColor} />}
            {activeTab === "details" && <DetailsPanel />}
          </div>
        </div>
      </div>

      <MuseAssistant open={museOpen} onClose={() => setMuseOpen(false)} />
    </div>
  );
}
