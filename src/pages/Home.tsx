import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GarmentStage } from "../components/Garment";
import FeatureCarousel from "../components/home/FeatureCarousel";
import GradientMesh from "../components/home/GradientMesh";
import GlowButton from "../components/home/GlowButton";
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

/*
 * Literal hex, not CSS var() references — see the matching note in
 * HomeCarouselSlides.tsx. These get string-concatenated with alpha suffixes
 * and fed into GarmentPreview's canvas-based `color` prop, both of which
 * need a real color value, not a custom-property name. Keep in sync with
 * the --color-lime/violet/coral/gold tokens in index.css.
 */
const LIME = "#c7ff2e";
const VIOLET = "#8b5cff";
const CORAL = "#ff5c5c";
const GOLD = "#d6b36a";

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
      className="glass-dark grain grain-invert relative aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-[28px] sm:aspect-square lg:aspect-[4/5]"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 0 110px -25px rgba(139,92,255,0.5), 0 0 150px -40px rgba(199,255,46,0.3), 0 60px 140px -50px rgba(0,0,0,0.85)",
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* soft glow behind the floating garment */}
      <div
        className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[70px]"
        style={{ background: `radial-gradient(circle, ${VIOLET} 0%, transparent 70%)` }}
      />

      {/* blank state */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <GarmentStage garment="tshirt" colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
      </div>

      {/* designed state, revealed by clip */}
      <div className="absolute inset-0 flex items-center justify-center p-10 animate-float-slow" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        <GarmentStage
          garment="tshirt"
          colorHex={LIME}
          view="front"
          className="h-full w-full"
          frontOverlay={
            <g>
              <text x="180" y="172" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="20" fill="#0d0d0f" fontStyle="italic">
                Your Design.
              </text>
              <line x1="150" y1="185" x2="210" y2="185" stroke="#0d0d0f" strokeWidth="1" opacity="0.6" />
              <text x="180" y="203" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="3" fill="#0d0d0f" opacity="0.7">
                NO. 001
              </text>
            </g>
          }
        />
      </div>

      <div className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 flex-col items-center bg-ivory/40" style={{ left: `${pct}%` }}>
        <div
          className="mt-auto mb-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#15151a] shadow-lg"
          style={{ boxShadow: `0 0 20px -4px ${LIME}88` }}
        >
          <IconRemix className="h-4 w-4" style={{ color: LIME }} />
        </div>
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory/60 backdrop-blur">
        Blank canvas
      </div>
      <div
        className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#0d0d0f] backdrop-blur"
        style={{ background: LIME }}
      >
        Your creation
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-ivory/35">
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
    tone: "#e8e6f0",
  },
  {
    id: "muse",
    n: "02",
    title: "Muse",
    body: "Describe the aesthetic you're imagining. You don't have to know the fashion terms — MUSE does.",
    cta: "Tell MUSE",
    icon: IconSparkle,
    mode: "prompt" as const,
    tone: VIOLET,
  },
  {
    id: "draw",
    n: "03",
    title: "Draw",
    body: "Start with a blank canvas. Draw it rough — FORMÉ helps refine it without losing your idea.",
    cta: "Draw It",
    icon: IconPencil,
    mode: "scratch" as const,
    tone: "#e8e6f0",
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
    <div className="grain grain-invert relative bg-[#0d0d0f] text-ivory">
      <GradientMesh fixed />

      {/* HERO */}
      <section className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-[12px] uppercase tracking-[0.3em] text-ivory/40 animate-fade-up">FORMÉ — a design prototype</p>
          <h1 className="font-display-heavy text-[clamp(2.9rem,9vw,6.4rem)] uppercase leading-[0.86] tracking-tight text-ivory animate-fade-up [animation-delay:80ms]">
            You can be
            <br />
            your own
            <br />
            <span style={{ color: LIME, textShadow: `0 0 40px ${LIME}55` }}>designer.</span>
          </h1>
          <p className="mt-7 max-w-md text-balance text-lg leading-relaxed text-ivory/55 animate-fade-up [animation-delay:160ms]">
            Create it from scratch. Find something you love. Remix it. Make it yours.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5 animate-fade-up [animation-delay:240ms]">
            <GlowButton tone={LIME} onClick={() => navigate("/create")}>
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 border-b pb-1 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory/80 transition-colors hover:text-ivory"
              style={{ borderColor: `${CORAL}66` }}
            >
              Explore Marketplace
            </Link>
          </div>
          <p className="mt-6 max-w-sm text-[13px] uppercase tracking-[0.1em] text-ivory/35 animate-fade-up [animation-delay:320ms]">
            T-shirts available now · Hoodies, caps &amp; more coming soon
          </p>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <HeroReveal />
        </div>
      </section>

      {/* FEATURE CAROUSEL */}
      <section className="relative border-t border-white/[0.06] py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-0 sm:px-4">
          <div className="mb-8 px-5 sm:px-4">
            <p className="text-[12px] uppercase tracking-[0.3em] text-ivory/35">The FORMÉ concept, in five slides</p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* WAYS TO CREATE */}
      <section className="relative border-t border-white/[0.06] bg-[#15151a] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: VIOLET }}>Getting started</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ivory">How do you imagine it?</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CREATE_WAYS.map(({ id, n, title, body, cta, icon: Icon, mode, tone }) => (
              <button
                key={id}
                onClick={() => {
                  track("start_creating", { mode });
                  navigate("/create", { state: { mode } });
                }}
                className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.06] sm:p-9"
              >
                <span className="font-display text-sm text-ivory/30">{n}</span>
                <div
                  className="mt-6 flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                  style={{ color: tone, border: `1.5px solid ${tone}55`, background: `${tone}14` }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-ivory">{title}</h3>
                <p className="mt-2 text-sm text-ivory/50">{body}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-ivory/80">
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
              dark
            />
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="relative border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: CORAL }}>Discover</p>
              <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ivory">
                Made by people.
                <br />
                Not algorithms.
              </h2>
              <p className="mt-3 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] text-ivory/40">
                Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ivory/50 hover:text-ivory"
            >
              Explore Marketplace
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketPicks.map((d) => (
              <div
                key={d.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <Link to="/marketplace" className="block">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden p-6" style={{ background: `${CORAL}10` }}>
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <p className="truncate font-display text-base text-ivory sm:text-lg">{d.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="truncate text-xs text-ivory/40">by @{d.creator}</p>
                      <p className="shrink-0 text-xs font-medium text-ivory/80">₹{d.price.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => goRemix(d)}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#0d0d0f]/85 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ivory opacity-0 backdrop-blur transition-opacity hover:bg-[#0d0d0f] group-hover:opacity-100"
                >
                  <IconRemix className="h-3 w-3" /> Remix
                </button>
              </div>
            ))}
          </LazyMount>
        </div>
      </section>

      {/* CREATOR ECONOMY */}
      <section className="relative border-t border-white/[0.06] bg-[#15151a] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>From idea to income</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ivory">
              Make something worth sharing.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EARN_FLOW.map(({ n, title, body, icon: Icon }, i) => (
              <div key={n} className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <span className="font-display text-sm text-ivory/30">{n}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-ivory" style={{ color: GOLD }}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-xl text-ivory">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ivory/50">{body}</p>
                {i < EARN_FLOW.length - 1 && (
                  <IconArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-ivory/20 lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
            <p className="max-w-xl text-[13px] leading-relaxed text-ivory/60">
              If your design sells, you receive a share of the profit — 10% to start.{" "}
              <span className="italic text-ivory/35">Illustrative creator reward — subject to final FORMÉ terms.</span>
            </p>
            <GlowButton tone={GOLD} onClick={() => navigate("/create")} className="shrink-0">
              Create &amp; Sell
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="relative border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: VIOLET }}>What's next</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-ivory">
              The FORMÉ universe is growing.
            </h2>
            <p className="mt-4 text-[15px] text-ivory/50">More ways to wear your imagination are coming.</p>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GARMENTS.map((g) => (
              <div key={g.id} className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className={`flex aspect-[4/5] items-center justify-center p-6 ${g.available ? "" : "opacity-45 grayscale"}`}>
                  <GarmentStage garment={g.id} colorHex={g.available ? LIME : COLORS[1].hex} view="front" className="h-full w-full" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-display text-lg text-ivory">{g.label}</p>
                  {g.available ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: LIME }}>
                      Available now
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory/35">
                      <IconLock className="h-3 w-3" /> Coming soon
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="flex aspect-[4/5] items-center justify-center p-6 text-ivory/25">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-16 w-16 opacity-60">
                  <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                  <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
                </svg>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-lg text-ivory">Socks</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory/35">
                  <IconLock className="h-3 w-3" /> Coming soon
                </p>
              </div>
            </div>
          </LazyMount>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#15151a] py-24 text-center sm:py-32">
        <GradientMesh />
        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="font-display-heavy text-[clamp(2.4rem,8vw,5rem)] uppercase leading-[0.9] text-ivory">
            So... what are you making?
          </h2>
          <div className="mt-9 flex justify-center">
            <GlowButton tone={LIME} onClick={() => navigate("/create")}>
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>
      </section>
    </div>
  );
}
