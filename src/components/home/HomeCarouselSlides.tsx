import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GarmentStage } from "../Garment";
import { colorById } from "../../data/catalog";
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
} from "../icons";

interface SlideProps {
  /** Whether this slide is the one currently in view. */
  active: boolean;
}

/**
 * Every slide in this carousel is mounted in the DOM at all times (the
 * shared Carousel shell just translates the track) — so without this, every
 * slide's photographic garment canvases would composite on first paint
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
      className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em]"
      style={{ color: onPlum ? "#faf4eacc" : tone }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {children}
    </p>
  );
}

/** Lightweight stand-in shown until a slide's real photographic visual has been asked for at least once. */
function VisualSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#241f1a]/[0.06] ${className ?? ""}`} />;
}

/**
 * Glass card shell shared by every slide — a warm ivory-to-champagne surface
 * (no pink/lavender), or (`plumBg`) a deep-plum surface with ivory text for
 * the marketplace/earn moments the brand spec calls out as dark sections.
 */
function SlideShell({ plumBg, children }: { plumBg?: boolean; children: ReactNode }) {
  return (
    <div
      className={`grain ${plumBg ? "grain-deep" : ""} relative h-full overflow-hidden rounded-[28px] sm:mx-8 sm:rounded-[32px] lg:mx-12`}
      style={{
        background: plumBg ? "linear-gradient(150deg, #241f1a 0%, #140f0c 100%)" : "linear-gradient(150deg, #FAF7F1 0%, #F2E9DA 100%)",
        boxShadow: plumBg
          ? "0 0 0 1px rgba(255,255,255,0.1), 0 40px 100px -50px rgba(0,0,0,0.5)"
          : "0 0 0 1px rgba(255,255,255,0.7), 0 24px 64px -38px rgba(70,55,35,0.16)",
      }}
    >
      {children}
    </div>
  );
}

const PLUM = "#241f1a";
const VIOLET = "#c8a96b";
const GOLD = "#d4af70";

/* ----------------------------------------------------------------------- */
/* SLIDE — How do you imagine it?                                          */
/* ----------------------------------------------------------------------- */

const WAYS = [
  { id: "image", label: "Upload an image", body: "Show us your inspiration — a photo, a screenshot, anything.", icon: IconUpload, tone: PLUM },
  { id: "muse", label: "Tell AI (MUSE)", body: "Describe it in a sentence. Our AI turns it into a starting point.", icon: IconSparkle, tone: VIOLET },
  { id: "draw", label: "Draw it yourself", body: "Start from a blank canvas. Rough is fine — we refine it.", icon: IconDraw, tone: PLUM },
];

export function SlideThreeWays({ active: _active }: SlideProps) {
  const navigate = useNavigate();
  return (
    <SlideShell>
      <div className="flex h-full flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
        <Eyebrow tone={PLUM}>Three ways to design</Eyebrow>
        <h3 className="font-display-heavy max-w-2xl text-[clamp(2rem,6vw,3.6rem)] uppercase leading-[0.9] tracking-tight text-[#17151a]">
          How do you imagine it?
        </h3>

        <div className="mt-7 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3 sm:gap-5">
          {WAYS.map(({ id, label, body, icon: Icon, tone }) => {
            const isMuse = id === "muse";
            return (
              <button
                key={id}
                onClick={() => {
                  track("start_creating", { mode: id, source: "home_carousel" });
                  navigate("/create", { state: { mode: id === "image" ? "upload" : id === "muse" ? "prompt" : "scratch" } });
                }}
                className={`group relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
                  isMuse
                    ? "border-[#d4af70]/50 bg-gradient-to-b from-white/70 to-[#d4af70]/10 shadow-[0_18px_50px_-28px_rgba(200,169,107,0.6)] sm:-translate-y-2 sm:scale-[1.04] sm:hover:-translate-y-3"
                    : "border-white/60 bg-white/45 hover:bg-white/65"
                }`}
              >
                {isMuse && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-[#241f1a] px-2.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-[#d4af70]">
                    Most popular
                  </span>
                )}
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                  style={{ color: tone, border: `1.5px solid ${tone}44`, background: `${tone}12` }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-xl text-[#17151a]">{label}</p>
                <p className="mt-1 text-[13px] text-[#17151a]/55">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#17151a]/45 transition-colors group-hover:text-[#17151a]/80">
                  Try it
                  <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
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
    <SlideShell>
      <div className="flex h-full flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone={GOLD}>Discover</Eyebrow>
            <h3 className="font-display-heavy max-w-lg text-[clamp(1.9rem,5.5vw,3.2rem)] uppercase leading-[0.9] tracking-tight text-[#17151a]">
              Find something you love.
            </h3>
            <p className="mt-3 max-w-sm text-[14px] text-[#17151a]/55">
              Designing is easy — a prompt or an image works just as well as a blank canvas. Or skip straight to browsing what others made.
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-4">
          {DISCOVER_PICKS.map((d) => (
            <div key={d.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/45">
              <div className="relative flex h-28 items-center justify-center p-4 sm:h-36" style={{ background: `${d.accent}1a` }}>
                {ready ? (
                  <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                ) : (
                  <VisualSkeleton className="h-full w-full" />
                )}
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#241f1a]/85 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-white">
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

const SELL_SAMPLE = MARKET_DESIGNS.find((d) => d.garment === "tshirt") ?? MARKET_DESIGNS[0];

export function SlideCreateShareEarn({ active }: SlideProps) {
  const navigate = useNavigate();
  const ready = useLazyActive(active);
  return (
    <SlideShell>
      <div className="grid h-full grid-cols-1 items-center gap-6 px-6 py-9 sm:gap-8 sm:px-10 sm:py-12 md:grid-cols-2 md:gap-10 lg:px-14">
        {/* LEFT — story + CTA */}
        <div className="flex flex-col justify-center">
          <Eyebrow tone={GOLD}>You can sell what you create</Eyebrow>
          <h3 className="font-display-heavy max-w-lg text-[clamp(1.9rem,5vw,3.2rem)] uppercase leading-[0.92] tracking-tight text-[#17151a]">
            Create it. Sell it.
            <br />
            Earn from it.
          </h3>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#17151a]/60">
            Create once. Sell it on FORMÉ.
            <br />
            We handle production and fulfilment — you earn whenever it sells.
          </p>

          <div className="mt-8">
            <GlowButton onClick={() => navigate("/create", { state: { mode: "scratch" } })}>
              Start Selling
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
          <p className="mt-4 text-[11px] italic text-[#17151a]/40">Illustrative — subject to final FORMÉ marketplace terms.</p>
        </div>

        {/* RIGHT — the create → list → earn journey, given real visual room */}
        <div className="flex flex-col gap-3">
          {/* your design */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/55 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl p-2.5" style={{ background: `${GOLD}14` }}>
              {ready ? (
                <GarmentStage garment={SELL_SAMPLE.garment} colorHex={colorById(SELL_SAMPLE.color).hex} view="front" className="h-full w-full" />
              ) : (
                <VisualSkeleton className="h-full w-full" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#17151a]/45">Your design</p>
              <p className="mt-1 truncate font-display text-lg text-[#17151a]">{SELL_SAMPLE.name}</p>
            </div>
          </div>

          <IconArrowRight className="h-4 w-4 rotate-90 self-center text-[#17151a]/25" />

          {/* marketplace listing */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/55 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl" style={{ background: `${GOLD}14` }}>
              <IconStore className="h-7 w-7" style={{ color: GOLD }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#17151a]/45">Live on FORMÉ</p>
              <p className="mt-1 font-display text-lg text-[#17151a]">₹{SELL_SAMPLE.price.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <IconArrowRight className="h-4 w-4 rotate-90 self-center text-[#17151a]/25" />

          {/* you earn */}
          <div className="flex items-center gap-4 rounded-2xl border border-[#d4af70]/40 bg-[#d4af70]/[0.14] p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#d4af70]/40 bg-white/40">
              <span className="font-display-heavy text-2xl" style={{ color: "#8f7345" }}>%</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "#8f7345" }}>You earn</p>
              <p className="mt-1 font-display text-lg text-[#17151a]">Every sale</p>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
