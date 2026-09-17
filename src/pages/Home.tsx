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
 * the --color-plum/pink/gold/peach tokens in index.css.
 */
const PLUM = "#351c45";
const PLUM_DEEP = "#201129";
const PINK = "#ff6fae";
const GOLD = "#e5c07b";

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
      className="glass-warm grain relative aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-[32px] sm:aspect-square lg:aspect-[4/5]"
      style={{
        background: "linear-gradient(155deg, rgba(255,244,230,0.92) 0%, rgba(255,179,138,0.6) 100%)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.6), 0 0 100px -30px ${PINK}66, 0 0 130px -35px ${GOLD}55, 0 55px 130px -55px rgba(53,28,69,0.4)`,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* soft glow behind the floating garment */}
      <div
        className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[70px]"
        style={{ background: `radial-gradient(circle, ${PINK} 0%, transparent 70%)` }}
      />

      {/* blank state */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <GarmentStage garment="tshirt" colorHex={COLORS[6].hex} view="front" className="h-full w-full" />
      </div>

      {/* designed state, revealed by clip */}
      <div className="animate-float-tilt absolute inset-0 flex items-center justify-center p-10" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        <GarmentStage
          garment="tshirt"
          colorHex={PINK}
          view="front"
          className="h-full w-full"
          frontOverlay={
            <g>
              <text x="180" y="172" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="20" fill="#1a1518" fontStyle="italic">
                Your Design.
              </text>
              <line x1="150" y1="185" x2="210" y2="185" stroke="#1a1518" strokeWidth="1" opacity="0.6" />
              <text x="180" y="203" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="3" fill="#1a1518" opacity="0.7">
                NO. 001
              </text>
            </g>
          }
        />
      </div>

      <div className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 flex-col items-center bg-white/70" style={{ left: `${pct}%` }}>
        <div
          className="mt-auto mb-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 shadow-lg"
          style={{ background: PLUM, boxShadow: `0 0 20px -4px ${GOLD}aa` }}
        >
          <IconRemix className="h-4 w-4" style={{ color: GOLD }} />
        </div>
      </div>

      <div className="glass-warm absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a1518]/70">
        Blank canvas
      </div>
      <div
        className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#351c45]"
        style={{ background: GOLD }}
      >
        Your creation
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-[#1a1518]/40">
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
    tone: PINK,
  },
  {
    id: "muse",
    n: "02",
    title: "Muse",
    body: "Describe the aesthetic you're imagining. You don't have to know the fashion terms — MUSE does.",
    cta: "Tell MUSE",
    icon: IconSparkle,
    mode: "prompt" as const,
    tone: GOLD,
  },
  {
    id: "draw",
    n: "03",
    title: "Draw",
    body: "Start with a blank canvas. Draw it rough — FORMÉ helps refine it without losing your idea.",
    cta: "Draw It",
    icon: IconPencil,
    mode: "scratch" as const,
    tone: PINK,
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
    <div className="grain relative bg-[#fff4e6] text-[#1a1518]">
      <GradientMesh fixed />

      {/* HERO — cream + pink gradient */}
      <section className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-[12px] uppercase tracking-[0.3em] text-[#1a1518]/40 animate-fade-up">FORMÉ — a design prototype</p>
          <h1 className="font-display-heavy text-[clamp(2.6rem,8vw,5.4rem)] uppercase leading-[0.88] tracking-tight text-[#1a1518] animate-fade-up [animation-delay:80ms]">
            You can
            <br />
            <span className="text-[clamp(3.1rem,9.5vw,6.6rem)]">create.</span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(100deg, ${PLUM}, ${PINK})` }}>
              Your own world.
            </span>
          </h1>
          <p className="mt-7 max-w-md text-balance text-lg leading-relaxed text-[#1a1518]/60 animate-fade-up [animation-delay:160ms]">
            Create it from scratch. Find something you love. Remix it. Make it yours.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:240ms]">
            <GlowButton onClick={() => navigate("/create")}>
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
            <GlowButton variant="secondary" onClick={() => navigate("/marketplace")}>
              Explore Marketplace
            </GlowButton>
          </div>
          <p className="mt-6 max-w-sm text-[13px] uppercase tracking-[0.1em] text-[#1a1518]/35 animate-fade-up [animation-delay:320ms]">
            T-shirts available now · Hoodies, caps &amp; more coming soon
          </p>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <HeroReveal />
        </div>
      </section>

      {/* FEATURE CAROUSEL — soft peach */}
      <section
        className="relative border-t border-[#351c45]/10 py-14 sm:py-20"
        style={{ background: "linear-gradient(180deg, rgba(255,244,230,0.5) 0%, rgba(255,179,138,0.5) 50%, rgba(255,244,230,0.5) 100%)" }}
      >
        <div className="mx-auto max-w-[1400px] px-0 sm:px-4">
          <div className="mb-8 px-5 sm:px-4">
            <p className="text-[12px] uppercase tracking-[0.3em] text-[#351c45]/50">The FORMÉ concept, in five slides</p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* WAYS TO CREATE — pink/plum artistic "creation studio" */}
      <section
        className="grain grain-deep relative overflow-hidden border-t border-white/10 py-20 text-[#fff4e6] sm:py-28"
        style={{ background: `linear-gradient(155deg, ${PLUM} 0%, ${PLUM_DEEP} 100%)` }}
      >
        <GradientMesh variant="plum" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>Getting started</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#fff4e6]">How do you imagine it?</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CREATE_WAYS.map(({ id, n, title, body, cta, icon: Icon, mode, tone }) => (
              <button
                key={id}
                onClick={() => {
                  track("start_creating", { mode });
                  navigate("/create", { state: { mode } });
                }}
                className="glass-plum group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/10 p-8 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 sm:p-9"
              >
                <span className="font-display text-sm text-[#fff4e6]/30">{n}</span>
                <div
                  className="mt-6 flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                  style={{ color: tone, border: `1.5px solid ${tone}55`, background: `${tone}1a` }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-[#fff4e6]">{title}</h3>
                <p className="mt-2 text-sm text-[#fff4e6]/55">{body}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#fff4e6]/85">
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

      {/* MARKETPLACE PREVIEW — deep plum with cream text */}
      <section
        className="grain grain-deep relative border-t border-white/10 py-20 text-[#fff4e6] sm:py-28"
        style={{ background: `linear-gradient(165deg, ${PLUM_DEEP} 0%, ${PLUM} 100%)` }}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>Discover</p>
              <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#fff4e6]">
                Made by people.
                <br />
                Not algorithms.
              </h2>
              <p className="mt-3 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] text-[#fff4e6]/45">
                Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#fff4e6]/60 hover:text-[#fff4e6]"
            >
              Explore Marketplace
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketPicks.map((d) => (
              <div
                key={d.id}
                className="glass-plum group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:border-white/25"
              >
                <Link to="/marketplace" className="block">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden p-6" style={{ background: `${PINK}14` }}>
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <p className="truncate font-display text-base text-[#fff4e6] sm:text-lg">{d.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="truncate text-xs text-[#fff4e6]/45">by @{d.creator}</p>
                      <p className="shrink-0 text-xs font-medium text-[#fff4e6]/85">₹{d.price.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => goRemix(d)}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#201129]/85 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#fff4e6] opacity-0 backdrop-blur transition-opacity hover:bg-[#201129] group-hover:opacity-100"
                >
                  <IconRemix className="h-3 w-3" /> Remix
                </button>
              </div>
            ))}
          </LazyMount>
        </div>
      </section>

      {/* CREATOR ECONOMY — cream */}
      <section className="relative border-t border-[#351c45]/10 py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: PINK }}>From idea to income</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#1a1518]">
              Make something worth sharing.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EARN_FLOW.map(({ n, title, body, icon: Icon }, i) => (
              <div
                key={n}
                className="glass-warm relative rounded-3xl border border-white/60 p-7 shadow-[0_16px_40px_-28px_rgba(53,28,69,0.35)] transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="font-display text-sm text-[#1a1518]/30">{n}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border" style={{ color: PLUM, borderColor: `${GOLD}88`, background: `${GOLD}22` }}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-xl text-[#1a1518]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#1a1518]/55">{body}</p>
                {i < EARN_FLOW.length - 1 && (
                  <IconArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#351c45]/20 lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="glass-warm mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/60 px-6 py-5">
            <p className="max-w-xl text-[13px] leading-relaxed text-[#1a1518]/65">
              If your design sells, you receive a share of the profit — 10% to start.{" "}
              <span className="italic text-[#1a1518]/35">Illustrative creator reward — subject to final FORMÉ terms.</span>
            </p>
            <GlowButton onClick={() => navigate("/create")} className="shrink-0">
              Create &amp; Sell
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>
      </section>

      {/* COMING SOON — soft peach */}
      <section
        className="relative border-t border-[#351c45]/10 py-20 sm:py-28"
        style={{ background: "linear-gradient(180deg, rgba(255,244,230,0.5) 0%, rgba(255,179,138,0.5) 50%, rgba(255,244,230,0.5) 100%)" }}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: PLUM }}>What's next</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#1a1518]">
              The FORMÉ universe is growing.
            </h2>
            <p className="mt-4 text-[15px] text-[#1a1518]/55">More ways to wear your imagination are coming.</p>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GARMENTS.map((g) => (
              <div key={g.id} className="glass-warm relative flex flex-col overflow-hidden rounded-3xl border border-white/60">
                <div className={`flex aspect-[4/5] items-center justify-center p-6 ${g.available ? "" : "opacity-45 grayscale"}`}>
                  <GarmentStage garment={g.id} colorHex={g.available ? PINK : COLORS[1].hex} view="front" className="h-full w-full" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-display text-lg text-[#1a1518]">{g.label}</p>
                  {g.available ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: PLUM }}>
                      Available now
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a1518]/35">
                      <IconLock className="h-3 w-3" /> Coming soon
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-[#351c45]/20 bg-white/25">
              <div className="flex aspect-[4/5] items-center justify-center p-6 text-[#351c45]/25">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-16 w-16 opacity-60">
                  <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                  <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
                </svg>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-lg text-[#1a1518]">Socks</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a1518]/35">
                  <IconLock className="h-3 w-3" /> Coming soon
                </p>
              </div>
            </div>
          </LazyMount>
        </div>
      </section>

      {/* FINAL CTA — pink/plum gradient, bookending the hero */}
      <section
        className="grain grain-deep relative overflow-hidden border-t border-white/10 py-24 text-center text-[#fff4e6] sm:py-32"
        style={{ background: `linear-gradient(135deg, ${PLUM} 0%, #7a3d63 55%, ${PINK} 130%)` }}
      >
        <GradientMesh variant="plum" />
        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="font-display-heavy text-[clamp(2.4rem,8vw,5rem)] uppercase leading-[0.9] text-[#fff4e6]">
            So... what are you making?
          </h2>
          <div className="mt-9 flex justify-center">
            <GlowButton variant="secondary" onClick={() => navigate("/create")}>
              Start Creating
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>
      </section>
    </div>
  );
}
