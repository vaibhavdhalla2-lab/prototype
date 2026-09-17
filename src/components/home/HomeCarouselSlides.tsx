import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GarmentPreview from "../garment/GarmentPreview";
import { GarmentStage } from "../Garment";
import { GARMENTS, COLORS, colorById } from "../../data/catalog";
import { MARKET_DESIGNS } from "../../data/marketplace";
import { track } from "../../lib/analytics";
import {
  IconArrowRight,
  IconUpload,
  IconSparkle,
  IconDraw,
  IconRemix,
  IconStore,
  IconLock,
} from "../icons";

interface SlideProps {
  /** Whether this slide is the one currently in view. */
  active: boolean;
}

/**
 * Every slide in this carousel is mounted in the DOM at all times (the
 * shared Carousel shell just translates the track) — so without this, all
 * five slides' photographic garment canvases would composite on first paint
 * even though only one is visible. This makes a slide's heavy visuals wait
 * for their first activation, then keeps them mounted (cheap afterwards,
 * since the compositor caches per color/asset) instead of unmounting again.
 */
function useLazyActive(active: boolean) {
  const [everActive, setEverActive] = useState(active);
  useEffect(() => {
    if (active) setEverActive(true);
  }, [active]);
  return everActive;
}

/* Shared slide chrome ------------------------------------------------- */

function Eyebrow({ children, tone }: { children: string; tone: string }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: tone }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {children}
    </p>
  );
}

function SlideCTA({ label, tone, onClick }: { label: string; tone: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group mt-8 inline-flex w-fit items-center gap-2.5 rounded-full px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory transition-all hover:-translate-y-0.5"
      style={{ background: tone, boxShadow: `0 16px 40px -16px ${tone}99` }}
    >
      {label}
      <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

/** Lightweight stand-in shown until a slide's real photographic visual has been asked for at least once. */
function VisualSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink/[0.04] ${className ?? ""}`} />;
}

const ORANGE = "var(--color-accent-orange)";
const RED = "var(--color-accent-red)";
const BLUE = "var(--color-accent-blue)";
const LIME_DEEP = "var(--color-accent-lime-deep)";

/* ----------------------------------------------------------------------- */
/* SLIDE 1 — Create your own                                                */
/* ----------------------------------------------------------------------- */

export function SlideCreateFromScratch({ active }: SlideProps) {
  const navigate = useNavigate();
  const ready = useLazyActive(active);
  return (
    <div className="grain relative h-full overflow-hidden rounded-[28px] border border-line-soft bg-paper sm:mx-24 sm:rounded-[32px] lg:mx-28">
      <div className="grid h-full grid-cols-1 items-center gap-8 px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-14">
        <div className="order-2 lg:order-1">
          <Eyebrow tone={ORANGE}>Getting started</Eyebrow>
          <h3 className="font-display-heavy text-[clamp(2.4rem,7.5vw,4.6rem)] uppercase leading-[0.86] tracking-tight text-ink">
            Create
            <br />
            your own.
          </h3>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
            Start with a blank T-shirt and make it yours — no design experience required.
          </p>
          <SlideCTA label="Start Creating" tone={ORANGE} onClick={() => { track("start_creating", { mode: "scratch", source: "home_carousel" }); navigate("/create", { state: { mode: "scratch" } }); }} />
        </div>

        <div className="order-1 flex items-center justify-center gap-4 lg:order-2">
          <div className="relative w-[46%] max-w-[170px]">
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-ivory-dim/60 p-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10 text-ink-faint/50">
                <path d="M8 3h8l2 4-1 2v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9L6 7l2-4z" />
              </svg>
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-3 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-faint shadow-sm">
              Blank canvas
            </span>
          </div>
          <IconArrowRight className="h-5 w-5 shrink-0 text-ink-faint" />
          <div className="relative w-[46%] max-w-[170px]">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl border p-4 shadow-[0_20px_50px_-24px_rgba(217,102,43,0.45)]" style={{ borderColor: `${ORANGE}55`, background: `${ORANGE}0f` }}>
              {ready ? (
                <GarmentPreview garment="tshirt" color={COLORS[0].hex} className="h-full w-full" alt="Designed T-shirt" />
              ) : (
                <VisualSkeleton className="h-full w-full" />
              )}
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ivory shadow-sm" style={{ background: ORANGE }}>
              Made by you
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 2 — How do you imagine it?                                         */
/* ----------------------------------------------------------------------- */

const WAYS = [
  { id: "image", label: "Upload", body: "Show us your inspiration.", icon: IconUpload, tone: "#1a1712" },
  { id: "muse", label: "Muse", body: "Tell us what you're imagining.", icon: IconSparkle, tone: BLUE },
  { id: "draw", label: "Draw", body: "Draw it yourself.", icon: IconDraw, tone: "#1a1712" },
];

export function SlideThreeWays({ active: _active }: SlideProps) {
  const navigate = useNavigate();
  return (
    <div className="grain relative h-full overflow-hidden rounded-[28px] border border-line-soft bg-ivory-dim sm:mx-24 sm:rounded-[32px] lg:mx-28">
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={BLUE}>Three ways to design</Eyebrow>
        <h3 className="font-display-heavy max-w-2xl text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-ink">
          How do you imagine it?
        </h3>

        <div className="mt-7 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {WAYS.map(({ id, label, body, icon: Icon, tone }) => (
            <button
              key={id}
              onClick={() => { track("start_creating", { mode: id, source: "home_carousel" }); navigate("/create", { state: { mode: id === "image" ? "upload" : id === "muse" ? "prompt" : "scratch" } }); }}
              className="group flex flex-col items-start rounded-2xl border border-line bg-paper p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(26,23,18,0.4)] sm:p-6"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                style={{ color: tone, border: `1.5px solid ${tone}55`, background: `${tone}0d` }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl text-ink">{label}</p>
              <p className="mt-1 text-[13px] text-ink-soft">{body}</p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint transition-colors group-hover:text-ink">
                Try it
                <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 3 — Discover the marketplace                                       */
/* ----------------------------------------------------------------------- */

const DISCOVER_PICKS = MARKET_DESIGNS.filter((d) => d.garment === "tshirt").slice(0, 3);

export function SlideDiscoverMarketplace({ active }: SlideProps) {
  const navigate = useNavigate();
  const ready = useLazyActive(active);
  return (
    <div className="grain relative h-full overflow-hidden rounded-[28px] border border-line-soft bg-paper sm:mx-24 sm:rounded-[32px] lg:mx-28">
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone={RED}>Not here to design?</Eyebrow>
            <h3 className="font-display-heavy max-w-lg text-[clamp(1.9rem,5.5vw,3.2rem)] uppercase leading-[0.9] tracking-tight text-ink">
              Find something you love.
            </h3>
            <p className="mt-3 max-w-sm text-[14px] text-ink-soft">Discover designs made by people like you. Buy it. Remix it. Make it yours.</p>
          </div>
        </div>

        <div className="mt-7 grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          {DISCOVER_PICKS.map((d) => (
            <div key={d.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-ivory-dim">
              <div className="relative flex h-28 items-center justify-center p-4 sm:h-36" style={{ background: `${d.accent}14` }}>
                {ready ? (
                  <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                ) : (
                  <VisualSkeleton className="h-full w-full" />
                )}
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-ivory">
                  <IconRemix className="h-2.5 w-2.5" />
                  {d.remixes}
                </span>
              </div>
              <div className="p-2.5 sm:p-3.5">
                <p className="truncate font-display text-[13px] sm:text-base text-ink">{d.name}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="truncate text-[10.5px] text-ink-faint">@{d.creator}</p>
                  <p className="shrink-0 text-[10.5px] font-medium text-ink">₹{d.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <SlideCTA label="Explore Marketplace" tone={RED} onClick={() => navigate("/marketplace")} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 4 — Create, share, earn                                            */
/* ----------------------------------------------------------------------- */

const EARN_FLOW = [
  { label: "You create", icon: IconSparkle },
  { label: "Publish", icon: IconArrowRight },
  { label: "Someone discovers it", icon: IconStore },
  { label: "They buy or remix", icon: IconRemix },
  { label: "You earn", icon: IconArrowRight },
];

export function SlideCreateShareEarn({ active: _active }: SlideProps) {
  const navigate = useNavigate();
  return (
    <div className="grain relative h-full overflow-hidden rounded-[28px] border border-line-soft bg-ink sm:mx-24 sm:rounded-[32px] lg:mx-28">
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={RED}>From idea to income</Eyebrow>
        <h3 className="font-display-heavy max-w-2xl text-[clamp(1.9rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-ivory">
          Your design.
          <br />
          Their next favourite.
        </h3>

        <div className="mt-8 flex flex-1 flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {EARN_FLOW.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 rounded-full border border-ivory/20 bg-ivory/[0.06] px-4 py-2.5">
                <Icon className="h-3.5 w-3.5 text-ivory/70" />
                <span className="whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.1em] text-ivory">{label}</span>
              </div>
              {i < EARN_FLOW.length - 1 && <IconArrowRight className="hidden h-3.5 w-3.5 text-ivory/30 sm:block" />}
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] italic text-ivory/50">Illustrative creator reward — subject to final FORMÉ terms.</p>
          <button
            onClick={() => navigate("/create")}
            className="group inline-flex items-center gap-2.5 rounded-full bg-ivory px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ink transition-all hover:-translate-y-0.5"
          >
            Create &amp; Sell
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 5 — This is just the beginning                                     */
/* ----------------------------------------------------------------------- */

export function SlideFormeFuture({ active }: SlideProps) {
  const ready = useLazyActive(active);
  return (
    <div className="grain relative h-full overflow-hidden rounded-[28px] border border-line-soft bg-paper sm:mx-24 sm:rounded-[32px] lg:mx-28">
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={LIME_DEEP}>The FORMÉ universe</Eyebrow>
        <h3 className="font-display-heavy max-w-xl text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-ink">
          This is just the beginning.
        </h3>

        <div className="mt-6 grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GARMENTS.map((g) => (
            <div key={g.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-ivory-dim">
              <div className={`flex h-24 items-center justify-center p-4 sm:h-32 ${g.available ? "" : "opacity-40 grayscale"}`}>
                {ready ? (
                  <GarmentStage garment={g.id} colorHex={COLORS[0].hex} view="front" className="h-full w-full" />
                ) : (
                  <VisualSkeleton className="h-full w-full" />
                )}
              </div>
              <div className="p-3 text-center">
                <p className="font-display text-sm text-ink">{g.label}</p>
                {g.available ? (
                  <p className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]" style={{ color: LIME_DEEP }}>
                    Available now
                  </p>
                ) : (
                  <p className="mt-1 flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                    <IconLock className="h-2.5 w-2.5" /> Coming soon
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-line bg-ivory-dim/60">
            <div className="flex h-24 items-center justify-center p-4 sm:h-32 text-ink-faint">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-14 w-14 opacity-50">
                <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
              </svg>
            </div>
            <div className="p-3 text-center">
              <p className="font-display text-sm text-ink">Socks</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                <IconLock className="h-2.5 w-2.5" /> Coming soon
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[13px] text-ink-soft">More ways to wear your imagination are coming.</p>
      </div>
    </div>
  );
}
