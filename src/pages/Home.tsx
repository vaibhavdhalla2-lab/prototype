import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GarmentStage } from "../components/Garment";
import { MARKET_DESIGNS } from "../data/marketplace";
import { COLORS } from "../data/catalog";
import { IconArrowRight, IconUpload, IconSparkle, IconPencil, IconRemix, IconStore } from "../components/icons";
import MicroPrompt from "../components/MicroPrompt";
import { track } from "../lib/analytics";

function ChipStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-ivory px-3 py-2.5">
      <p className="text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-1 text-[12px] font-medium leading-tight text-ink">{value}</p>
    </div>
  );
}

const EARN_STEPS = [
  { n: "01", title: "Create", body: "Design something only you would make — from scratch, an image, or a prompt.", icon: IconPencil },
  { n: "02", title: "Share", body: "Publish it to the FORMÉ marketplace for the community to discover and remix.", icon: IconStore },
  { n: "03", title: "Earn", body: "Every purchase or remix of your design earns you a creator reward.", icon: IconArrowRight },
];

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
        <GarmentStage garment="hoodie" colorHex={COLORS[1].hex} view="front" className="h-full w-full" />
      </div>

      {/* designed state, revealed by clip */}
      <div className="absolute inset-0 flex items-center justify-center p-10" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        <GarmentStage
          garment="hoodie"
          colorHex={COLORS[0].hex}
          view="front"
          className="h-full w-full"
          frontOverlay={
            <g>
              <text x="180" y="175" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="21" fill="#f1ead9" fontStyle="italic">
                Tokyo
              </text>
              <line x1="150" y1="188" x2="210" y2="188" stroke="#f1ead9" strokeWidth="1" opacity="0.7" />
              <text x="180" y="206" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="3" fill="#f1ead9" opacity="0.8">
                MIDNIGHT
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

const CREATE_MODES = [
  {
    n: "01",
    title: "Start From Scratch",
    body: "Begin with a blank canvas and make it yours.",
    cta: "Start From Scratch",
    icon: IconPencil,
    mode: "scratch" as const,
  },
  {
    n: "02",
    title: "Upload An Image",
    body: "Have something in mind? Show us.",
    cta: "Upload Image",
    icon: IconUpload,
    mode: "upload" as const,
  },
  {
    n: "03",
    title: "Describe It",
    body: "Tell MUSE what you're imagining.",
    cta: "Describe Your Idea",
    icon: IconSparkle,
    mode: "prompt" as const,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const featured = MARKET_DESIGNS.slice(0, 4);

  useEffect(() => {
    track("landing_view");
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-32 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-[12px] uppercase tracking-[0.3em] text-ink-faint animate-fade-up">FORMÉ — a design prototype</p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.98] tracking-tight text-ink animate-fade-up [animation-delay:80ms]">
            Imagine it.
            <br />
            Wear it.
          </h1>
          <p className="mt-7 max-w-md text-balance text-lg leading-relaxed text-ink-soft animate-fade-up [animation-delay:160ms]">
            Your imagination is the starting point. Design clothing that feels like you — even if you've never designed
            anything before.
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
          <p className="mt-6 font-display italic text-ink-faint animate-fade-up [animation-delay:320ms]">
            "You don't have to be a fashion designer. You just have to imagine it."
          </p>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <HeroReveal />
        </div>
      </section>

      {/* THREE WAYS TO CREATE */}
      <section className="border-t border-line-soft bg-paper py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-ink-faint">Getting started</p>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">How do you want to create?</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CREATE_MODES.map(({ n, title, body, cta, icon: Icon, mode }) => (
              <button
                key={mode}
                onClick={() => {
                  track("start_creating", { mode });
                  navigate("/create", { state: { mode } });
                }}
                className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-line bg-ivory p-8 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-[0_24px_60px_-24px_rgba(26,23,18,0.35)] sm:p-9"
              >
                <span className="font-display text-sm text-ink-faint">{n}</span>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-line-soft text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
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

      {/* MUSE GUIDANCE */}
      <section className="border-t border-line-soft bg-ivory-dim py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-ink-faint">Guided, not overwhelmed</p>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">MUSE will help you shape it.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Upload a photo, describe a vibe, or just start drawing — MUSE reads what you're going for and
              suggests the material, fit and colour to match.
            </p>
            <Link
              to="/create"
              className="mt-7 inline-flex items-center gap-2 border-b border-ink/30 pb-1 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
            >
              Try It Yourself
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-line-soft bg-paper p-6 shadow-[0_30px_80px_-40px_rgba(26,23,18,0.3)] sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-clay-deep">
              <IconSparkle className="h-3.5 w-3.5" /> Muse
            </div>
            <p className="mt-4 text-balance font-display text-xl italic leading-snug text-ink">
              "I see an oversized silhouette, heavyweight fabric and a minimal graphic."
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <ChipStat label="Material" value="Heavyweight Cotton" />
              <ChipStat label="Fit" value="Oversized" />
              <ChipStat label="Colour" value="Washed Black" />
            </div>
          </div>
        </div>
      </section>

      {/* CREATE → SHARE → EARN */}
      <section className="border-t border-line-soft py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-ink-faint">From idea to income</p>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">Create. Share. Earn.</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {EARN_STEPS.map(({ n, title, body, icon: Icon }) => (
              <div key={n} className="rounded-3xl border border-line bg-paper p-8">
                <span className="font-display text-sm text-ink-faint">{n}</span>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-line-soft text-ink">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE TEASER */}
      <section className="border-t border-line-soft py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-ink-faint">Discover</p>
              <h2 className="font-display text-4xl text-ink sm:text-5xl">Don't just shop. Discover.</h2>
              <p className="mt-3 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.12em] text-ink-faint">
                Discover <IconArrowRight className="h-3 w-3" /> Remix <IconArrowRight className="h-3 w-3" /> Make it yours
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
            >
              View Marketplace
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featured.map((d) => (
              <Link
                key={d.id}
                to="/marketplace"
                className="group block overflow-hidden rounded-2xl border border-line bg-paper transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(26,23,18,0.35)]"
              >
                <div className="relative flex aspect-[4/5] items-center justify-center p-6" style={{ background: `${d.accent}14` }}>
                  <GarmentStage garment={d.garment} colorHex={COLORS.find((c) => c.id === d.color)!.hex} view="front" className="h-full w-full" />
                  <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ivory opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <IconRemix className="h-3 w-3" /> Remix
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-display text-lg text-ink">{d.name}</p>
                  <p className="text-xs text-ink-faint">by @{d.creator}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
