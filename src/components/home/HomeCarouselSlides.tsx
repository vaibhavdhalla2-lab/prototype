import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import GarmentPreview from "../garment/GarmentPreview";
import { GarmentStage } from "../Garment";
import { GARMENTS, COLORS, colorById } from "../../data/catalog";
import { MARKET_DESIGNS } from "../../data/marketplace";
import { track } from "../../lib/analytics";
import GlowButton from "../GlowButton";
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

function Eyebrow({ children, tone, onPlum }: { children: string; tone: string; onPlum?: boolean }) {
  return (
    <p
      className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em]"
      style={{ color: onPlum ? "#faf4eacc" : tone }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {children}
    </p>
  );
}

/** Lightweight stand-in shown until a slide's real photographic visual has been asked for at least once. */
function VisualSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#351c45]/[0.06] ${className ?? ""}`} />;
}

/**
 * Glass card shell shared by every slide — an ivory-to-lavender gradient
 * glass surface with a soft glow ring in the slide's accent, or (`plumBg`)
 * a deep-plum surface with ivory text for the marketplace/earn moments the
 * brand spec calls out as dark sections.
 */
function SlideShell({ tone, plumBg, children }: { tone: string; plumBg?: boolean; children: ReactNode }) {
  return (
    <div
      className={`grain ${plumBg ? "grain-deep" : ""} relative h-full overflow-hidden rounded-[28px] sm:mx-24 sm:rounded-[32px] lg:mx-28`}
      style={{
        background: plumBg
          ? "linear-gradient(150deg, #351c45 0%, #24102f 100%)"
          : "linear-gradient(150deg, rgba(250,244,234,0.94) 0%, rgba(233,213,255,0.55) 100%)",
        boxShadow: plumBg
          ? `0 0 0 1px rgba(255,255,255,0.1), 0 0 90px -30px ${tone}77, 0 40px 100px -50px rgba(0,0,0,0.5)`
          : `0 0 0 1px rgba(255,255,255,0.6), 0 0 90px -35px ${tone}66, 0 40px 90px -55px rgba(53,28,69,0.25)`,
      }}
    >
      {children}
    </div>
  );
}

const PLUM = "#351c45";
const VIOLET = "#8b5cf6";
const GOLD = "#d4af70";

/* ----------------------------------------------------------------------- */
/* SLIDE 1 — Create your own                                                */
/* ----------------------------------------------------------------------- */

export function SlideCreateFromScratch({ active }: SlideProps) {
  const navigate = useNavigate();
  const ready = useLazyActive(active);
  return (
    <SlideShell tone={GOLD}>
      <div className="grid h-full grid-cols-1 items-center gap-8 px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-14">
        <div className="order-2 lg:order-1">
          <Eyebrow tone={GOLD}>Getting started</Eyebrow>
          <h3 className="font-display-heavy text-[clamp(2.4rem,7.5vw,4.6rem)] uppercase leading-[0.86] tracking-tight text-[#17151a]">
            Create
            <br />
            your own.
          </h3>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#17151a]/60">
            Start with a blank T-shirt and make it yours — no design experience required.
          </p>
          <div className="mt-8">
            <GlowButton
              onClick={() => {
                track("start_creating", { mode: "scratch", source: "home_carousel" });
                navigate("/create", { state: { mode: "scratch" } });
              }}
            >
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center gap-4 lg:order-2">
          <div className="relative w-[46%] max-w-[170px]">
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#351c45]/20 bg-white/40 p-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10 text-[#351c45]/30">
                <path d="M8 3h8l2 4-1 2v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9L6 7l2-4z" />
              </svg>
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-[#17151a]/55 shadow-sm">
              Blank canvas
            </span>
          </div>
          <IconArrowRight className="h-5 w-5 shrink-0 text-[#351c45]/30" />
          <div className="relative w-[46%] max-w-[170px] animate-float-slow">
            <div
              className="aspect-[3/4] overflow-hidden rounded-2xl border p-4"
              style={{ borderColor: `${GOLD}55`, background: `${GOLD}14`, boxShadow: `0 0 40px -12px ${GOLD}77` }}
            >
              {ready ? (
                <GarmentPreview garment="tshirt" color={GOLD} className="h-full w-full" alt="Designed T-shirt" />
              ) : (
                <VisualSkeleton className="h-full w-full" />
              )}
            </div>
            <span
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-white shadow-sm"
              style={{ background: GOLD }}
            >
              Made by you
            </span>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 2 — How do you imagine it?                                         */
/* ----------------------------------------------------------------------- */

const WAYS = [
  { id: "image", label: "Upload", body: "Show us your inspiration.", icon: IconUpload, tone: PLUM },
  { id: "muse", label: "Muse", body: "Tell us what you're imagining.", icon: IconSparkle, tone: VIOLET },
  { id: "draw", label: "Draw", body: "Draw it yourself.", icon: IconDraw, tone: PLUM },
];

export function SlideThreeWays({ active: _active }: SlideProps) {
  const navigate = useNavigate();
  return (
    <SlideShell tone={PLUM}>
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={PLUM}>Three ways to design</Eyebrow>
        <h3 className="font-display-heavy max-w-2xl text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-[#17151a]">
          How do you imagine it?
        </h3>

        <div className="mt-7 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {WAYS.map(({ id, label, body, icon: Icon, tone }) => (
            <button
              key={id}
              onClick={() => {
                track("start_creating", { mode: id, source: "home_carousel" });
                navigate("/create", { state: { mode: id === "image" ? "upload" : id === "muse" ? "prompt" : "scratch" } });
              }}
              className="group flex flex-col items-start rounded-2xl border border-white/60 bg-white/45 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white/65 sm:p-6"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                style={{ color: tone, border: `1.5px solid ${tone}44`, background: `${tone}12` }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl text-[#17151a]">{label}</p>
              <p className="mt-1 text-[13px] text-[#17151a]/55">{body}</p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#17151a]/45 transition-colors group-hover:text-[#17151a]/80">
                Try it
                <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </SlideShell>
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
    <SlideShell tone={GOLD}>
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone={GOLD}>Not here to design?</Eyebrow>
            <h3 className="font-display-heavy max-w-lg text-[clamp(1.9rem,5.5vw,3.2rem)] uppercase leading-[0.9] tracking-tight text-[#17151a]">
              Find something you love.
            </h3>
            <p className="mt-3 max-w-sm text-[14px] text-[#17151a]/55">Discover designs made by people like you. Buy it. Remix it. Make it yours.</p>
          </div>
        </div>

        <div className="mt-7 grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          {DISCOVER_PICKS.map((d) => (
            <div key={d.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/45">
              <div className="relative flex h-28 items-center justify-center p-4 sm:h-36" style={{ background: `${d.accent}1a` }}>
                {ready ? (
                  <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                ) : (
                  <VisualSkeleton className="h-full w-full" />
                )}
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#351c45]/85 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-white">
                  <IconRemix className="h-2.5 w-2.5" />
                  {d.remixes}
                </span>
              </div>
              <div className="p-2.5 sm:p-3.5">
                <p className="truncate font-display text-[13px] sm:text-base text-[#17151a]">{d.name}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="truncate text-[10.5px] text-[#17151a]/45">@{d.creator}</p>
                  <p className="shrink-0 text-[10.5px] font-medium text-[#17151a]/80">₹{d.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <GlowButton variant="secondary" onClick={() => navigate("/marketplace")}>
            Explore Marketplace
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </GlowButton>
        </div>
      </div>
    </SlideShell>
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
    <SlideShell tone={GOLD} plumBg>
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={GOLD} onPlum>From idea to income</Eyebrow>
        <h3 className="font-display-heavy max-w-2xl text-[clamp(1.9rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-[#faf4ea]">
          Your design.
          <br />
          Their next favourite.
        </h3>

        <div className="mt-8 flex flex-1 flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {EARN_FLOW.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              <div className="glass-plum flex items-center gap-2.5 rounded-full px-4 py-2.5">
                <Icon className="h-3.5 w-3.5" style={{ color: GOLD }} />
                <span className="whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.1em] text-[#faf4ea]">{label}</span>
              </div>
              {i < EARN_FLOW.length - 1 && <IconArrowRight className="hidden h-3.5 w-3.5 text-[#faf4ea]/25 sm:block" />}
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] italic text-[#faf4ea]/45">Illustrative creator reward — subject to final FORMÉ terms.</p>
          <GlowButton onClick={() => navigate("/create")}>
            Create &amp; Sell
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </GlowButton>
        </div>
      </div>
    </SlideShell>
  );
}

/* ----------------------------------------------------------------------- */
/* SLIDE 5 — This is just the beginning                                     */
/* ----------------------------------------------------------------------- */

export function SlideFormeFuture({ active }: SlideProps) {
  const ready = useLazyActive(active);
  return (
    <SlideShell tone={GOLD}>
      <div className="flex h-full flex-col px-6 pt-9 pb-16 sm:px-10 sm:pt-12 sm:pb-14 lg:px-14">
        <Eyebrow tone={GOLD}>The FORMÉ universe</Eyebrow>
        <h3 className="font-display-heavy max-w-xl text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-[#17151a]">
          This is just the beginning.
        </h3>

        <div className="mt-6 grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GARMENTS.map((g) => (
            <div key={g.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/45">
              <div className={`flex h-24 items-center justify-center p-4 sm:h-32 ${g.available ? "" : "opacity-45 grayscale"}`}>
                {ready ? (
                  <GarmentStage garment={g.id} colorHex={g.available ? GOLD : COLORS[1].hex} view="front" className="h-full w-full" />
                ) : (
                  <VisualSkeleton className="h-full w-full" />
                )}
              </div>
              <div className="p-3 text-center">
                <p className="font-display text-sm text-[#17151a]">{g.label}</p>
                {g.available ? (
                  <p className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                    Available now
                  </p>
                ) : (
                  <p className="mt-1 flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#17151a]/35">
                    <IconLock className="h-2.5 w-2.5" /> Coming soon
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-[#351c45]/15 bg-white/30">
            <div className="flex h-24 items-center justify-center p-4 sm:h-32 text-[#351c45]/25">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-14 w-14 opacity-70">
                <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
              </svg>
            </div>
            <div className="p-3 text-center">
              <p className="font-display text-sm text-[#17151a]">Socks</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#17151a]/35">
                <IconLock className="h-2.5 w-2.5" /> Coming soon
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[13px] text-[#17151a]/50">More ways to wear your imagination are coming.</p>
      </div>
    </SlideShell>
  );
}
