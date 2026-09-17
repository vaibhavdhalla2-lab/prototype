import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MY_DESIGNS, type MyDesign } from "../data/profile";
import { colorById } from "../data/catalog";
import { GarmentStage } from "../components/Garment";
import GradientMesh from "../components/GradientMesh";
import GlowButton from "../components/GlowButton";
import { IconEye, IconRemix, IconStore, IconSparkle } from "../components/icons";
import { useOnboarding } from "../lib/onboarding";

type TabId = "all" | "draft" | "published" | "ordered";

// "Published" is intentionally not a tab here — published designs still show
// under "My Creations" (see STATUS_LABEL/STATUS_TONE on each card) and the
// data/counts below are untouched; this only changes what's navigable.
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "My Creations" },
  { id: "draft", label: "Drafts" },
  { id: "ordered", label: "Orders" },
];

const STATUS_LABEL: Record<MyDesign["status"], string> = { draft: "Draft", published: "Published", ordered: "Ordered" };
const STATUS_TONE: Record<MyDesign["status"], string> = {
  draft: "text-ink-faint border-line",
  published: "text-[#351c45] border-[#351c45]/35",
  ordered: "text-success border-success/30",
};

/** A gallery-style archive card — large visual preview first, like a piece in a collection. */
function DesignCard({ d }: { d: MyDesign }) {
  return (
    <div className="card-atelier group overflow-hidden">
      <div className="flex aspect-[4/5] items-center justify-center bg-[#d4af70]/[0.08] p-8">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="font-display text-xl text-ink">{d.name}</p>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.08em] ${STATUS_TONE[d.status]}`}>
            {STATUS_LABEL[d.status]}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-faint">Updated {d.updatedAt}</p>

        {d.status === "published" && d.stats && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#351c45]/10 pt-4 text-[13px] text-ink-soft">
            <span className="flex items-center gap-1.5"><IconEye className="h-3.5 w-3.5" /> {d.stats.views.toLocaleString("en-IN")}</span>
            <span className="flex items-center gap-1.5"><IconRemix className="h-3.5 w-3.5" /> {d.stats.remixes}</span>
            <span className="flex items-center gap-1.5"><IconStore className="h-3.5 w-3.5" /> {d.stats.purchases}</span>
            <span className="font-medium text-[#351c45]">₹{d.stats.earnings.toLocaleString("en-IN")} earned</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Only T-shirts are live right now — hoodies/caps stay "Coming Soon" (see
// CanvasPicker), so nothing you could actually order for them shows up here.
const TSHIRT_ONLY = MY_DESIGNS.filter((d) => d.garment === "tshirt");

export default function Profile() {
  const [tab, setTab] = useState<TabId>("all");
  const navigate = useNavigate();
  const { open: replayOnboarding } = useOnboarding();

  const filtered = tab === "all" ? TSHIRT_ONLY : TSHIRT_ONLY.filter((d) => d.status === tab);
  const counts = {
    all: TSHIRT_ONLY.length,
    draft: TSHIRT_ONLY.filter((d) => d.status === "draft").length,
    published: TSHIRT_ONLY.filter((d) => d.status === "published").length,
    ordered: TSHIRT_ONLY.filter((d) => d.status === "ordered").length,
  };

  const totalEarnings = TSHIRT_ONLY.reduce((sum, d) => sum + (d.stats?.earnings ?? 0), 0);

  return (
    <div className="grain relative">
      <GradientMesh fixed />
      <div className="relative mx-auto max-w-[1300px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#351c45] font-display text-2xl text-[#d4af70]">Y</div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "#d4af70" }}>Your archive</p>
            <h1 className="font-display text-3xl text-ink">Your Studio</h1>
            <p className="text-sm text-ink-soft">{TSHIRT_ONLY.length} creations · ₹{totalEarnings.toLocaleString("en-IN")} in creator earnings</p>
            <button
              onClick={replayOnboarding}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft"
            >
              <IconSparkle className="h-3.5 w-3.5" /> How FORMÉ Works
            </button>
          </div>
          <GlowButton onClick={() => navigate("/create", { state: { mode: "scratch" } })} className="ml-auto">
            + New Creation
          </GlowButton>
        </div>

        <div className="mt-10 flex flex-wrap gap-2 border-b border-[#351c45]/10 pb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
                tab === t.id ? "border-[#351c45] bg-[#351c45] text-[#d4af70]" : "border-line text-ink-soft hover:border-[#351c45]/40"
              }`}
            >
              {t.label} <span className="opacity-60">({counts[t.id]})</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-soft py-16 text-center text-ink-faint">
              Nothing here yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <DesignCard key={d.id} d={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
