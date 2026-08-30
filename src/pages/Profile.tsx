import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MY_DESIGNS, type MyDesign } from "../data/profile";
import { colorById } from "../data/catalog";
import { GarmentStage } from "../components/Garment";
import { IconEye, IconRemix, IconStore, IconSparkle } from "../components/icons";
import { useOnboarding } from "../lib/onboarding";

type TabId = "all" | "draft" | "published" | "ordered";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "My Creations" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "ordered", label: "Orders" },
];

const STATUS_LABEL: Record<MyDesign["status"], string> = { draft: "Draft", published: "Published", ordered: "Ordered" };
const STATUS_TONE: Record<MyDesign["status"], string> = {
  draft: "text-ink-faint border-line",
  published: "text-clay-deep border-clay/40",
  ordered: "text-success border-success/30",
};

function DesignRow({ d }: { d: MyDesign }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-[0_20px_50px_-28px_rgba(26,23,18,0.35)] sm:flex-row">
      <div className="flex h-40 shrink-0 items-center justify-center bg-ivory-dim p-5 sm:h-40 sm:w-44">
        <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col justify-center p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="font-display text-xl text-ink">{d.name}</p>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.08em] ${STATUS_TONE[d.status]}`}>
            {STATUS_LABEL[d.status]}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-faint">Updated {d.updatedAt}</p>

        {d.status === "published" && d.stats && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
            <span className="flex items-center gap-1.5"><IconEye className="h-3.5 w-3.5" /> {d.stats.views.toLocaleString("en-IN")} views</span>
            <span className="flex items-center gap-1.5"><IconRemix className="h-3.5 w-3.5" /> {d.stats.remixes} remixes</span>
            <span className="flex items-center gap-1.5"><IconStore className="h-3.5 w-3.5" /> {d.stats.purchases} purchases</span>
            <span className="font-medium text-ink">₹{d.stats.earnings.toLocaleString("en-IN")} earned</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const [tab, setTab] = useState<TabId>("all");
  const navigate = useNavigate();
  const { open: replayOnboarding } = useOnboarding();

  const filtered = tab === "all" ? MY_DESIGNS : MY_DESIGNS.filter((d) => d.status === tab);
  const counts = {
    all: MY_DESIGNS.length,
    draft: MY_DESIGNS.filter((d) => d.status === "draft").length,
    published: MY_DESIGNS.filter((d) => d.status === "published").length,
    ordered: MY_DESIGNS.filter((d) => d.status === "ordered").length,
  };

  const totalEarnings = MY_DESIGNS.reduce((sum, d) => sum + (d.stats?.earnings ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-2xl text-ivory">Y</div>
        <div>
          <h1 className="font-display text-3xl text-ink">Your Studio</h1>
          <p className="text-sm text-ink-soft">{MY_DESIGNS.length} creations · ₹{totalEarnings.toLocaleString("en-IN")} in creator earnings</p>
          <button
            onClick={replayOnboarding}
            className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft"
          >
            <IconSparkle className="h-3.5 w-3.5" /> How FORMÉ Works
          </button>
        </div>
        <button
          onClick={() => navigate("/create", { state: { mode: "scratch" } })}
          className="ml-auto rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory"
        >
          + New Creation
        </button>
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-line-soft pb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
              tab === t.id ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
            }`}
          >
            {t.label} <span className="opacity-60">({counts[t.id]})</span>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-soft py-16 text-center text-ink-faint">
            Nothing here yet.
          </div>
        ) : (
          filtered.map((d) => <DesignRow key={d.id} d={d} />)
        )}
      </div>
    </div>
  );
}
