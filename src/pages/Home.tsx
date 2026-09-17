import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GarmentStage } from "../components/Garment";
import FeatureCarousel from "../components/home/FeatureCarousel";
import LazyMount from "../components/LazyMount";
import { MARKET_DESIGNS } from "../data/marketplace";
import { COLORS, GARMENTS, colorById } from "../data/catalog";
import { useDesign } from "../lib/store";
import {
  IconArrowRight,
  IconUpload,
  IconSparkle,
  IconPencil,
  IconRemix,
  IconStore,
  IconLock,
} from "../components/icons";
import MicroPrompt from "../components/MicroPrompt";
import { track } from "../lib/analytics";

const ORANGE = "var(--color-accent-orange)";
const RED = "var(--color-accent-red)";
const BLUE = "var(--color-accent-blue)";
const LIME_DEEP = "var(--color-accent-lime-deep)";

/* ----------------------------------------------------------------------- */
/* HERO                                                                     */
/* ----------------------------------------------------------------------- */

function HeroReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(58);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(96, Math.max(4, raw)));
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-[28px] border border-line-soft bg-paper shadow-[0_30px_80px_-40px_rgba(26,23,18,0.35)] sm:aspect-square lg:aspect-[4/5]"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <div className="absolute inset-0 grain" />

      {/* blank state */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <GarmentStage garment="tshirt" colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
      </div>

      {/* designed state, revealed by clip */}
      <div className="absolute inset-0 flex items-center justify-center p-10" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        <GarmentStage
          garment="tshirt"
          colorHex={COLORS[3].hex}
          view="front"
          className="h-full w-full"
          frontOverlay={
            <g>
              <text x="180" y="172" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="20" fill="#f1ead9" fontStyle="italic">
                Your Design.
              </text>
              <line x1="150" y1="185" x2="210" y2="185" stroke="#f1ead9" strokeWidth="1" opacity="0.7" />
              <text x="180" y="203" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="3" fill="#f1ead9" opacity="0.8">
                NO. 001
              </text>
            </g>
          }
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 flex-col items-center bg-ink/70"
        style={{ left: `${pct}%` }}
      >
        <div className="mt-auto mb-auto flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-paper shadow-lg">
          <IconRemix className="h-4 w-4 text-ink" />
        </div>
      </div>

      <div className="absolute left-4 top-4 rounded-full bg-paper/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft backdrop-blur">
        Blank canvas
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory backdrop-blur">
        Your creation
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        Drag to reveal
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* WAYS TO CREATE                                                           */
/* ----------------------------------------------------------------------- */

const CREATE_WAYS = [
  {
    id: "image",
    n: "01",
    title: "Upload",
    body: "Show us your inspiration or artwork — a photo, a screenshot, anything that captures the idea.",
    cta: "Upload An Image",
    icon: IconUpload,
    mode: "upload" as const,
    tone: "#1a1712",
  },
  {
    id: "muse",
    n: "02",
    title: "Muse",
    body: "Describe the aesthetic you're imagining. You don't have to know the fashion terms — MUSE does.",
    cta: "Tell MUSE",
    icon: IconSparkle,
    mode: "prompt" as const,
    tone: BLUE,
  },
  {
    id: "draw",
    n: "03",
    title: "Draw",
    body: "Start with a blank canvas. Draw it rough — FORMÉ helps refine it without losing your idea.",
    cta: "Draw It",
    icon: IconPencil,
    mode: "scratch" as const,
    tone: "#1a1712",
  },
];

/* ----------------------------------------------------------------------- */
/* CREATOR ECONOMY FLOW                                                     */
/* ----------------------------------------------------------------------- */

const EARN_FLOW = [
  { n: "01", title: "Create", body: "Design something only you would make — from scratch, an image, or a prompt.", icon: IconPencil },
  { n: "02", title: "Publish", body: "Put it out into the world for the FORMÉ community to find.", icon: IconStore },
  { n: "03", title: "Discovered", body: "Someone finds your design — and buys it, or remixes it into their own.", icon: IconRemix },
  { n: "04", title: "Earn", body: "Every eligible sale or remix of your design earns you a creator reward.", icon: IconArrowRight },
];

export default function Home() {
  const navigate = useNavigate();
  const design = useDesign();
  const marketPicks = MARKET_DESIGNS.filter((d) => d.garment === "tshirt").slice(0, 6);

  useEffect(() => {
    track("landing_view");
  }, []);

  const goRemix = (d: (typeof MARKET_DESIGNS)[number]) => {
    design.loadFromMarketDesign(d);
    track("remix_clicked", { design: d.id, source: "home" });
    navigate("/create", { state: { mode: "remix" } });
  };

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">FORMÉ — a design prototype</p>
          <h1 className="font-display-heavy text-[clamp(2.9rem,9vw,6.4rem)] uppercase leading-[0.86] tracking-tight text-ink animate-fade-up [animation-delay:80ms]">
            You can be
            <br />
            your own
            <br />
            <span style={{ color: ORANGE }}>designer.</span>
          </h1>
          <p className="mt-7 max-w-md text-balance text-lg leading-relaxed text-ink-soft animate-fade-up [animation-delay:160ms]">
            Create it from scratch. Find something you love. Remix it. Make it yours.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:240ms]">
            <button
              onClick={() => navigate("/create")}
              className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(26,23,18,0.5)]"
            >
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 border-b border-ink/30 pb-1 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
            >
              Explore Marketplace
            </Link>
          </div>
          <p className="mt-6 max-w-sm text-[13px] uppercase tracking-[0.1em] text-ink-faint animate-fade-up [animation-delay:320ms]">
            T-shirts available now · Hoodies, caps &amp; more coming soon
          </p>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <HeroReveal />
        </div>
      </section>

      {/* FEATURE CAROUSEL */}
      <section className="border-t border-line-soft bg-paper py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-0 sm:px-4">
          <div className="mb-8 px-5 sm:px-4">
            <p className="text-[12px] uppercase tracking-[0.3em] text-ink-faint">The FORMÉ concept, in five slides</p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* WAYS TO CREATE */}
      <section className="border-t border-line-soft py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: BLUE }}>Getting started</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ink">How do you imagine it?</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CREATE_WAYS.map(({ id, n, title, body, cta, icon: Icon, mode, tone }) => (
              <button
                key={id}
                onClick={() => {
                  track("start_creating", { mode });
                  navigate("/create", { state: { mode } });
                }}
                className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-line bg-ivory p-8 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-[0_24px_60px_-24px_rgba(26,23,18,0.35)] sm:p-9"
              >
                <span className="font-display text-sm text-ink-faint">{n}</span>
                <div
                  className="mt-6 flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                  style={{ color: tone, border: `1.5px solid ${tone}55`, background: `${tone}0d` }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{body}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink">
                  {cta}
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>

          <div className="mt-10">
            <MicroPrompt
              question="Would a platform like this excite you?"
              eventName="homepage_concept"
              className="max-w-2xl"
            />
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="border-t border-line-soft py-20 sm:py-28" style={{ background: `${RED}06` }}>
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: RED }}>Discover</p>
              <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ink">
                Made by people.
                <br />
                Not algorithms.
              </h2>
              <p className="mt-3 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] text-ink-faint">
                Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
            >
              Explore Marketplace
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketPicks.map((d) => (
              <div
                key={d.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(26,23,18,0.35)]"
              >
                <Link to="/marketplace" className="block">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden p-6" style={{ background: `${d.accent}14` }}>
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <p className="truncate font-display text-base text-ink sm:text-lg">{d.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="truncate text-xs text-ink-faint">by @{d.creator}</p>
                      <p className="shrink-0 text-xs font-medium text-ink">₹{d.price.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => goRemix(d)}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ivory opacity-0 backdrop-blur transition-opacity hover:bg-ink group-hover:opacity-100"
                >
                  <IconRemix className="h-3 w-3" /> Remix
                </button>
              </div>
            ))}
          </LazyMount>
        </div>
      </section>

      {/* CREATOR ECONOMY */}
      <section className="border-t border-line-soft bg-ink py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: RED }}>From idea to income</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ivory">
              Make something worth sharing.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EARN_FLOW.map(({ n, title, body, icon: Icon }, i) => (
              <div key={n} className="relative rounded-3xl border border-ivory/15 bg-ivory/[0.04] p-7">
                <span className="font-display text-sm text-ivory/40">{n}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 text-ivory">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-xl text-ivory">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ivory/60">{body}</p>
                {i < EARN_FLOW.length - 1 && (
                  <IconArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-ivory/25 lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ivory/15 bg-ivory/[0.04] px-6 py-5">
            <p className="max-w-xl text-[13px] leading-relaxed text-ivory/70">
              If your design sells, you receive a share of the profit — 10% to start.{" "}
              <span className="italic text-ivory/45">Illustrative creator reward — subject to final FORMÉ terms.</span>
            </p>
            <button
              onClick={() => navigate("/create")}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-ivory px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ink transition-all hover:-translate-y-0.5"
            >
              Create &amp; Sell
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="border-t border-line-soft py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: LIME_DEEP }}>What's next</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ink">
              The FORMÉ universe is growing.
            </h2>
            <p className="mt-4 text-[15px] text-ink-soft">More ways to wear your imagination are coming.</p>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GARMENTS.map((g) => (
              <div key={g.id} className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-paper">
                <div className={`flex aspect-[4/5] items-center justify-center p-6 ${g.available ? "" : "opacity-45 grayscale"}`}>
                  <GarmentStage garment={g.id} colorHex={COLORS[0].hex} view="front" className="h-full w-full" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-display text-lg text-ink">{g.label}</p>
                  {g.available ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: LIME_DEEP }}>
                      Available now
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                      <IconLock className="h-3 w-3" /> Coming soon
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-line bg-ivory-dim/60">
              <div className="flex aspect-[4/5] items-center justify-center p-6 text-ink-faint">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-16 w-16 opacity-50">
                  <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                  <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
                </svg>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-lg text-ink">Socks</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                  <IconLock className="h-3 w-3" /> Coming soon
                </p>
              </div>
            </div>
          </LazyMount>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-line-soft py-24 text-center sm:py-32">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="font-display-heavy text-[clamp(2.4rem,8vw,5rem)] uppercase leading-[0.9] text-ink">
            So... what are you making?
          </h2>
          <button
            onClick={() => navigate("/create")}
            className="group mx-auto mt-9 inline-flex items-center gap-2.5 rounded-full bg-ink px-8 py-4.5 text-[13px] font-medium uppercase tracking-[0.16em] text-ivory transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(26,23,18,0.5)]"
          >
            Start Creating
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
}
