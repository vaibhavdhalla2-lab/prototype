import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GarmentStage } from "../components/Garment";
import Carousel from "../components/onboarding/Carousel";
import { SlideThreeWays, SlideDiscoverMarketplace, SlideCreateShareEarn } from "../components/home/HomeCarouselSlides";
import GradientMesh from "../components/GradientMesh";
import GlowButton from "../components/GlowButton";
import LazyMount from "../components/LazyMount";
import { MARKET_DESIGNS } from "../data/marketplace";
import { COLORS, GARMENTS, colorById } from "../data/catalog";
import { PRODUCTS } from "../data/products";
import ProductStage from "../components/products/ProductStage";
import { useDesign } from "../lib/store";
import { IconArrowRight, IconPencil, IconRemix, IconStore, IconLock, IconHeart, IconSparkle, IconUpload, IconDraw, IconType } from "../components/icons";
import type { ProductDef } from "../data/products";
import MicroPrompt from "../components/MicroPrompt";
import { track } from "../lib/analytics";
import { useFeedback } from "../lib/feedback";

/*
 * Literal hex, not CSS var() references — see the matching note in
 * HomeCarouselSlides.tsx. These get string-concatenated with alpha suffixes
 * and fed into GarmentPreview's canvas-based `color` prop, both of which
 * need a real color value, not a custom-property name. Keep in sync with
 * the --color-plum/violet/gold tokens in index.css.
 */
const PLUM = "#241f1a";
const PLUM_DEEP = "#140f0c";
const VIOLET = "#c8a96b";
const GOLD = "#d4af70";

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

  // Slide 1 of the hero carousel — stopPropagation keeps this drag gesture
  // from also being read as a swipe-to-change-slide gesture by the parent
  // Carousel, which listens for the same pointer events on its viewport.
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
    e.stopPropagation();
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX);
    e.stopPropagation();
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className="glass-plum grain grain-deep relative aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-[32px] sm:aspect-square lg:aspect-[4/5]"
      style={{
        background: `linear-gradient(155deg, ${PLUM} 0%, ${PLUM_DEEP} 100%)`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 110px -28px ${VIOLET}55, 0 0 150px -40px ${GOLD}40, 0 60px 140px -55px rgba(0,0,0,0.6)`,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* soft glow behind the floating garment — the "premium lighting" */}
      <div
        className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[70px]"
        style={{ background: `radial-gradient(circle, ${VIOLET} 0%, transparent 70%)` }}
      />

      {/* blank state */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <GarmentStage garment="tshirt" colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
      </div>

      {/* designed state, revealed by clip */}
      <div className="animate-float-tilt absolute inset-0 flex items-center justify-center p-10" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        <GarmentStage
          garment="tshirt"
          colorHex={GOLD}
          view="front"
          className="h-full w-full"
          frontOverlay={
            <g>
              <text x="180" y="172" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="20" fill="#140f0c" fontStyle="italic">
                Your Design.
              </text>
              <line x1="150" y1="185" x2="210" y2="185" stroke="#140f0c" strokeWidth="1" opacity="0.6" />
              <text x="180" y="203" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="3" fill="#140f0c" opacity="0.7">
                NO. 001
              </text>
            </g>
          }
        />
      </div>

      <div className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 flex-col items-center bg-white/20" style={{ left: `${pct}%` }}>
        <div
          className="mt-auto mb-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 shadow-lg"
          style={{ background: GOLD, boxShadow: `0 0 20px -4px ${GOLD}aa` }}
        >
          <IconRemix className="h-4 w-4" style={{ color: PLUM_DEEP }} />
        </div>
      </div>

      <div className="glass-plum absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#faf4ea]/70">
        Blank canvas
      </div>
      <div
        className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#140f0c]"
        style={{ background: GOLD }}
      >
        Your creation
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.14em] text-[#faf4ea]/35">
        Drag to reveal
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* HERO CAROUSEL — slide 1 is the hero itself, unchanged                    */
/* ----------------------------------------------------------------------- */

const HERO_PROMPT_EXAMPLES = [
  "Create a cream ceramic mug with tiny botanical illustrations and 'Slow Mornings' in elegant serif typography.",
  "Design a vintage motorsport poster in cream and burgundy.",
  "Create a forest-green phone case with tiny serif initials.",
  "Make a playful mug for someone who loves coffee and cats.",
  "Create a panoramic Tokyo-night desk mat in navy and muted red.",
];

function SlideHeroIntro() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(HERO_PROMPT_EXAMPLES[0]);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    const id = window.setInterval(() => {
      setExampleIndex((i) => {
        const next = (i + 1) % HERO_PROMPT_EXAMPLES.length;
        setPrompt(HERO_PROMPT_EXAMPLES[next]);
        return next;
      });
    }, 4800);
    return () => window.clearInterval(id);
  }, [dirty]);

  const createWithMuse = () => {
    track("start_creating", { mode: "prompt", source: "home_hero" });
    navigate("/create", { state: { mode: "prompt", prefillText: prompt } });
  };

  return (
    <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-8">
      <div className="order-2 lg:order-1">
        <p className="mb-4 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.3em] animate-fade-up" style={{ color: GOLD }}>
          <IconSparkle className="h-3.5 w-3.5" /> Create with MUSE
        </p>
        <h1 className="font-display-heavy text-[clamp(2.3rem,6.4vw,4.2rem)] uppercase leading-[0.94] tracking-tight text-[#17151a] animate-fade-up [animation-delay:80ms]">
          From a prompt
          <br />
          to <span className="text-gradient-gold">something real.</span>
        </h1>
        <p className="mt-4 max-w-md text-balance text-[16px] leading-relaxed text-[#17151a]/60 animate-fade-up [animation-delay:160ms]">
          Describe the product you're imagining and MUSE creates the entire design for you — ready to refine down to the smallest detail.
        </p>

        <div className="mt-5 animate-fade-up [animation-delay:220ms]">
          <div className="rounded-3xl border border-[#241f1a]/12 bg-white/70 p-2 shadow-[0_30px_70px_-45px_rgba(36,31,26,0.35)] backdrop-blur">
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setDirty(true);
              }}
              rows={3}
              placeholder="Describe the product you're imagining..."
              className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-[15px] italic leading-relaxed text-[#17151a] placeholder:text-[#17151a]/40 placeholder:not-italic focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                {HERO_PROMPT_EXAMPLES.map((_, i) => (
                  <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === exampleIndex && !dirty ? "w-4 bg-[#241f1a]/50" : "w-1 bg-[#241f1a]/15"}`} />
                ))}
              </div>
              <GlowButton onClick={createWithMuse} className="shrink-0">
                <IconSparkle className="h-4 w-4" />
                Create With MUSE
              </GlowButton>
            </div>
          </div>
        </div>

        <div className="mt-4 animate-fade-up [animation-delay:280ms]">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#17151a]/40">Or start your way</p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/create", { state: { mode: "upload" } })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#241f1a]/15 bg-white/50 px-4 py-2 text-[12.5px] font-medium text-[#17151a] transition-colors hover:border-[#241f1a]/30"
            >
              <IconUpload className="h-3.5 w-3.5" /> Upload
            </button>
            <button
              onClick={() => navigate("/create", { state: { mode: "scratch" } })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#241f1a]/15 bg-white/50 px-4 py-2 text-[12.5px] font-medium text-[#17151a] transition-colors hover:border-[#241f1a]/30"
            >
              <IconDraw className="h-3.5 w-3.5" /> Draw
            </button>
            <button
              onClick={() => navigate("/create", { state: { mode: "scratch" } })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#241f1a]/15 bg-white/50 px-4 py-2 text-[12.5px] font-medium text-[#17151a] transition-colors hover:border-[#241f1a]/30"
            >
              <IconType className="h-3.5 w-3.5" /> Manual Design
            </button>
          </div>
        </div>
      </div>

      <div className="order-1 flex justify-center lg:order-2">
        <HeroReveal />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* CREATOR ECONOMY FLOW                                                     */
/* ----------------------------------------------------------------------- */

const EARN_FLOW = [
  { n: "01", title: "Create", body: "Design something only you would make — from scratch, an image, or a prompt.", icon: IconPencil },
  { n: "02", title: "Publish", body: "Put it out into the world for the FORMÉ community to find.", icon: IconStore },
  { n: "03", title: "Discovered", body: "Someone finds your design — and buys it, or remixes it into their own.", icon: IconRemix },
  { n: "04", title: "Earn", body: "Every eligible sale or remix of your design earns you a creator reward.", icon: IconArrowRight },
];

/* ----------------------------------------------------------------------- */
/* PRODUCT CATALOGUE — a bento layout with a "visual world" per product,    */
/* instead of six uniform cards in a straight line.                        */
/* ----------------------------------------------------------------------- */

const PRODUCT_WORLDS: Record<string, { bg: string; materials?: string; dark?: boolean }> = {
  tshirt: { bg: "radial-gradient(120% 120% at 28% 15%, rgba(212,175,112,0.24) 0%, rgba(250,244,234,0) 68%)", materials: "Regular · Oversized · Heavyweight" },
  mug: { bg: "radial-gradient(120% 130% at 75% 15%, rgba(201,154,111,0.3) 0%, rgba(250,244,234,0) 68%)", materials: "Ceramic · Enamel · Steel" },
  poster: { bg: "radial-gradient(120% 130% at 25% 85%, rgba(200,169,107,0.2) 0%, rgba(233,213,255,0.22) 45%, rgba(250,244,234,0) 75%)", materials: "Matte · Fine Art · Framed" },
  bottle: { bg: "radial-gradient(120% 130% at 75% 20%, rgba(127,166,171,0.28) 0%, rgba(250,244,234,0) 68%)", materials: "Steel · Aluminum · Insulated" },
  deskpad: { bg: "radial-gradient(120% 130% at 25% 80%, rgba(169,130,90,0.24) 0%, rgba(250,244,234,0) 68%)" },
  phonecase: { bg: "radial-gradient(120% 130% at 75% 20%, rgba(184,168,139,0.3) 0%, rgba(250,244,234,0) 68%)", materials: "Slim · Tough · Clear" },
};

function ProductCard({ p, hero, className, onSelect }: { p: ProductDef; hero?: boolean; className?: string; onSelect: () => void }) {
  const world = PRODUCT_WORLDS[p.id] ?? {};
  return (
    <button
      onClick={onSelect}
      className={`group relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 lg:aspect-auto ${
        world.dark ? "border-white/10 bg-[#241f1a]" : "border-[#241f1a]/10 bg-[#faf4ea]"
      } ${className ?? ""}`}
    >
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-5" style={{ background: world.bg }}>
        <div className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.1] ${hero ? "" : "scale-125"}`}>
          <ProductStage product={p.id} colorHex={COLORS[2].hex} view="front" variants={{}} className="h-full w-full" />
        </div>
      </div>
      <div className={`flex items-end justify-between gap-3 p-4 sm:p-5 ${world.dark ? "text-[#faf4ea]" : "text-[#17151a]"}`}>
        <div className="min-w-0">
          <p className={`truncate font-display ${hero ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>{p.label}</p>
          {world.materials && (
            <p className={`mt-0.5 truncate text-[11px] ${world.dark ? "text-[#faf4ea]/45" : "text-[#17151a]/40"}`}>{world.materials}</p>
          )}
          <p className={`mt-0.5 text-[11px] uppercase tracking-[0.1em] ${world.dark ? "text-[#faf4ea]/40" : "text-[#17151a]/35"}`}>
            From ₹{p.basePrice.toLocaleString("en-IN")}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] opacity-60 transition-opacity group-hover:opacity-100"
          style={{ color: world.dark ? GOLD : PLUM }}
        >
          Customize <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

/* ----------------------------------------------------------------------- */
/* GIFTING — example prompts shown on the homepage gifting teaser           */
/* ----------------------------------------------------------------------- */

const GIFT_EXAMPLES = [
  { who: "For a partner · Anniversary", prompt: "She loves warm colours, old film cameras, and quiet mornings.", result: "→ Suggested: a burgundy tee + a matching desk pad" },
  { who: "For a friend · Just because", prompt: "He's into vinyl records, cold brew, and Wes Anderson movies.", result: "→ Suggested: a mug + a framed poster" },
  { who: "For a colleague · Farewell", prompt: "Loud, funny, always the one making the group chat laugh.", result: "→ Suggested: a phone case + a bottle" },
];

export default function Home() {
  const navigate = useNavigate();
  const design = useDesign();
  const { open: openFeedback } = useFeedback();
  const [heroSlide, setHeroSlide] = useState(0);
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
    <div className="grain relative bg-[#faf4ea] text-[#17151a]">
      <GradientMesh fixed />

      {/* HERO CAROUSEL — slide 1 is the hero (ivory + purple atmospheric glow),
          slides 2-4 carry the "how FORMÉ works" story that used to be a
          separate widget further down the page. */}
      <section className="relative pb-10 pt-10 sm:pt-16">
        <div className="mx-auto max-w-[1400px] px-0 sm:px-4">
          <Carousel
            className="h-[900px] sm:h-[820px] lg:h-[740px]"
            onIndexChange={setHeroSlide}
            slides={[
              <SlideHeroIntro key="hero" />,
              <SlideThreeWays key="ways" active={heroSlide === 1} />,
              <SlideCreateShareEarn key="earn" active={heroSlide === 2} />,
              <SlideDiscoverMarketplace key="discover" active={heroSlide === 3} />,
            ]}
          />
        </div>
      </section>

      {/* THINGS YOU CAN MAKE — the real V1 product range, all live today, in a varied bento layout instead of six uniform cards in a row. */}
      <section className="relative border-t border-[#241f1a]/10 py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>The FORMÉ canvas</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#17151a]">
              Things you can make.
            </h2>
            <p className="mt-4 text-[16px] font-medium text-[#3a352c] sm:text-[18px]">
              T-Shirts · Mugs · Posters · Bottles · Desk Pads · Phone Cases
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
              Even more to come
            </p>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:auto-rows-[210px]">
            <ProductCard
              key={PRODUCTS[0].id}
              p={PRODUCTS[0]}
              hero
              className="col-span-2 sm:col-span-3 lg:col-span-3 lg:row-span-2"
              onSelect={() => {
                design.startFresh();
                design.setGarment(PRODUCTS[0].id);
                track("garment_selected", { garment: PRODUCTS[0].id, source: "home_products" });
                navigate("/create");
              }}
            />
            {[PRODUCTS[1], PRODUCTS[2]].map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                className="lg:col-span-3 lg:row-span-1"
                onSelect={() => {
                  design.startFresh();
                  design.setGarment(p.id);
                  track("garment_selected", { garment: p.id, source: "home_products" });
                  navigate("/create");
                }}
              />
            ))}
            {PRODUCTS.slice(3).map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                className="lg:col-span-2 lg:row-span-1"
                onSelect={() => {
                  design.startFresh();
                  design.setGarment(p.id);
                  track("garment_selected", { garment: p.id, source: "home_products" });
                  navigate("/create");
                }}
              />
            ))}
          </LazyMount>
        </div>
      </section>

      {/* QUICK PULSE — the "how it works" explainer now lives in the hero
          carousel above (slide 2), so this is just a lightweight check-in
          rather than a second full section repeating the same content. */}
      <section className="relative border-t border-[#241f1a]/10 py-14 sm:py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <MicroPrompt
            question="Would a platform like this excite you?"
            eventName="homepage_concept"
            className="max-w-2xl"
            onAnswer={(answer) => openFeedback({ exciteMoreThanClothing: answer === "Yes" ? "Yes" : "No" })}
          />
        </div>
      </section>

      {/* MARKETPLACE PREVIEW — deep plum with cream text and gold labels */}
      <section
        className="grain grain-deep relative border-t border-white/10 py-20 text-[#faf4ea] sm:py-28"
        style={{ background: `linear-gradient(165deg, ${PLUM_DEEP} 0%, ${PLUM} 100%)` }}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>Discover</p>
              <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#faf4ea]">
                Made by people.
                <br />
                Not algorithms.
              </h2>
              <p className="mt-3 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] text-[#faf4ea]/45">
                Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[#faf4ea]/60 hover:text-[#faf4ea]"
            >
              Explore Marketplace
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketPicks.map((d) => (
              <div
                key={d.id}
                className="glass-plum group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:border-[#d4af70]/40"
              >
                <Link to="/marketplace" className="block">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden p-6" style={{ background: `${GOLD}14` }}>
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <GarmentStage garment={d.garment} colorHex={colorById(d.color).hex} view="front" className="h-full w-full" />
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <p className="truncate font-display text-base text-[#faf4ea] sm:text-lg">{d.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="truncate text-xs text-[#faf4ea]/45">by @{d.creator}</p>
                      <p className="shrink-0 text-xs font-medium" style={{ color: GOLD }}>₹{d.price.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => goRemix(d)}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#140f0c]/85 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#faf4ea] opacity-0 backdrop-blur transition-opacity hover:bg-[#140f0c] group-hover:opacity-100"
                >
                  <IconRemix className="h-3 w-3" /> Remix
                </button>
              </div>
            ))}
          </LazyMount>
        </div>
      </section>

      {/* CREATOR ECONOMY — ivory */}
      <section className="relative border-t border-[#241f1a]/10 py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: VIOLET }}>From idea to income</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#17151a]">
              Make something worth sharing.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EARN_FLOW.map(({ n, title, body, icon: Icon }, i) => (
              <div
                key={n}
                className="card-atelier relative p-7 transition-transform duration-300"
              >
                <span className="font-display text-sm text-[#17151a]/30">{n}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border" style={{ color: PLUM, borderColor: `${GOLD}88`, background: `${GOLD}22` }}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-xl text-[#17151a]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#17151a]/55">{body}</p>
                {i < EARN_FLOW.length - 1 && (
                  <IconArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#241f1a]/20 lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="card-atelier mt-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <p className="max-w-xl text-[13px] leading-relaxed text-[#17151a]/65">
              If your design sells, you receive a share of the profit — 10% to start.{" "}
              <span className="italic text-[#17151a]/35">Illustrative creator reward — subject to final FORMÉ terms.</span>
            </p>
            <GlowButton onClick={() => navigate("/create")} className="shrink-0">
              Create &amp; Sell
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </div>
        </div>
      </section>

      {/* COMING SOON — soft champagne wash */}
      <section
        className="relative border-t border-[#241f1a]/10 py-20 sm:py-28"
        style={{ background: "linear-gradient(180deg, rgba(250,244,234,0.5) 0%, rgba(239,229,210,0.55) 50%, rgba(250,244,234,0.5) 100%)" }}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em]" style={{ color: PLUM }}>What's next</p>
            <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#17151a]">
              The FORMÉ universe will grow.
            </h2>
            <p className="mt-4 text-[15px] text-[#17151a]/55">
              Six products live today. More apparel — and more than apparel — is on the way.
            </p>
          </div>

          <LazyMount className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GARMENTS.map((g) => (
              <div key={g.id} className="card-atelier relative flex flex-col overflow-hidden">
                <div className={`flex aspect-[4/5] items-center justify-center p-6 ${g.available ? "" : "opacity-45 grayscale"}`}>
                  <GarmentStage garment={g.id} colorHex={g.available ? GOLD : COLORS[1].hex} view="front" className="h-full w-full" />
                </div>
                <div className="p-4 text-center">
                  <p className="font-display text-lg text-[#17151a]">{g.label}</p>
                  {g.available ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: PLUM }}>
                      Available now
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#17151a]/35">
                      <IconLock className="h-3 w-3" /> Coming soon
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-[#241f1a]/20 bg-white/25">
              <div className="flex aspect-[4/5] items-center justify-center p-6 text-[#241f1a]/25">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-16 w-16 opacity-60">
                  <path d="M14 6h20l2 8-3 3v25a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V17l-3-3 2-8z" />
                  <path d="M20 6c0 3 1.8 5 4 5s4-2 4-5" />
                </svg>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-lg text-[#17151a]">Socks</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#17151a]/35">
                  <IconLock className="h-3 w-3" /> Coming soon
                </p>
              </div>
            </div>
          </LazyMount>
        </div>
      </section>

      {/* GIFTING — a dedicated showcase for the Describe-a-Person flow, the platform's clearest differentiator. */}
      <section
        className="grain grain-deep relative overflow-hidden border-t border-white/10 py-20 text-[#faf4ea] sm:py-28"
        style={{ background: `linear-gradient(155deg, ${PLUM_DEEP} 0%, ${PLUM} 100%)` }}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                <IconHeart className="h-3.5 w-3.5" /> Gifting
              </p>
              <h2 className="font-display-heavy text-[clamp(2rem,5.5vw,3.6rem)] uppercase leading-[0.92] text-[#faf4ea]">
                Create a gift by describing the person.
              </h2>
              <p className="mt-4 max-w-md text-[15px] text-[#faf4ea]/60">
                Tell MUSE who it's for, their vibe, what they love. It comes back with gift concepts across every product — pick one and make it real.
              </p>
              <div className="mt-8">
                <GlowButton onClick={() => navigate("/create", { state: { mode: "gift" } })}>
                  Design A Gift
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </GlowButton>
              </div>
            </div>

            <div className="space-y-3">
              {GIFT_EXAMPLES.map((ex) => (
                <div key={ex.who} className="glass-plum rounded-2xl border border-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#faf4ea]/45">{ex.who}</p>
                  <p className="mt-1.5 text-[14px] italic leading-relaxed text-[#faf4ea]/85">"{ex.prompt}"</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#faf4ea]/55">
                    <IconArrowRight className="h-3 w-3" style={{ color: GOLD }} /> {ex.result}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — the plum→violet creative gradient, bookending the hero */}
      <section
        className="grain grain-deep relative overflow-hidden border-t border-white/10 py-24 text-center text-[#faf4ea] sm:py-32"
        style={{ background: `linear-gradient(135deg, ${PLUM} 0%, ${VIOLET} 130%)` }}
      >
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="font-display-heavy text-[clamp(2.4rem,8vw,5rem)] uppercase leading-[0.9] text-[#faf4ea]">
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
