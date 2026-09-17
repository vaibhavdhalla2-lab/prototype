import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight, IconUpload, IconSparkle, IconDraw, IconStore, IconRemix, IconHeart } from "../components/icons";
import GradientMesh from "../components/GradientMesh";
import GlowButton from "../components/GlowButton";
import Carousel from "../components/onboarding/Carousel";
import SlideUpload from "../components/onboarding/SlideUpload";
import SlideDraw from "../components/onboarding/SlideDraw";
import SlideMuseText from "../components/onboarding/SlideMuseText";
import SlideMarketplace from "../components/onboarding/SlideMarketplace";
import { useFeedback } from "../lib/feedback";

const PLUM = "#351c45";
const GOLD = "#d4af70";
const VIOLET = "#8b5cf6";

const WAYS = [
  {
    id: "image",
    mode: "upload",
    label: "Upload an image",
    body: "Show us what you're inspired by — a photo, a screenshot, anything.",
    icon: IconUpload,
    tone: PLUM,
  },
  {
    id: "muse",
    mode: "prompt",
    label: "Use MUSE",
    body: "Tell MUSE what you're imagining and let it help shape the design.",
    icon: IconSparkle,
    tone: VIOLET,
  },
  {
    id: "draw",
    mode: "scratch",
    label: "Draw it yourself",
    body: "Start with your own drawing — rough is fine, we'll refine it.",
    icon: IconDraw,
    tone: PLUM,
  },
];

const LOOP = [
  {
    label: "Discover unique designs",
    body: "Browse what the FORMÉ community is making, not a warehouse catalogue.",
    icon: IconStore,
  },
  {
    label: "Buy designs you love",
    body: "Find something you love? It can be yours.",
    icon: IconHeart,
  },
  {
    label: "Sell your own designs",
    body: "Publish your creations to the marketplace for others to discover.",
    icon: IconArrowRight,
  },
  {
    label: "Earn from your creations",
    body: "When your design sells, you earn a share. Illustrative — subject to final FORMÉ terms.",
    icon: IconSparkle,
  },
  {
    label: "Remix designs",
    body: "Like something? Remix it and make it your own.",
    icon: IconRemix,
  },
];

export default function About() {
  const navigate = useNavigate();
  const { open: openFeedback } = useFeedback();

  return (
    <div className="grain relative pb-24 pt-14 sm:pt-20">
      <GradientMesh fixed />
      <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
        <p className="mb-4 text-center text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>About FORMÉ</p>
        <h1 className="text-center font-display-heavy text-[clamp(2.6rem,8vw,4.6rem)] uppercase leading-[0.92] tracking-tight text-ink">
          Give your
          <br />
          <span className="text-gradient-plum">imagination form.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-center text-[16px] leading-relaxed text-ink-soft">
          FORMÉ is a working prototype, not a finished product — we're testing whether people actually want a
          platform where anyone can design and create their own physical clothing, no design experience required.
          Here's how it works.
        </p>
      </div>

      <div className="relative mx-auto mt-14 max-w-3xl px-2 sm:px-8">
        <AboutCarousel />
      </div>

      {/* MAIN FEATURES — what you can actually do on FORMÉ, scannable, not a paragraph. */}
      <div className="relative mx-auto mt-20 max-w-5xl px-5 sm:mt-24 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>What you can do</p>
          <h2 className="mt-3 font-display-heavy text-[clamp(2rem,6vw,3.2rem)] uppercase leading-[0.95] tracking-tight text-ink">
            Create your own design.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            You're not stuck picking from what already exists. On FORMÉ, you can be your own designer.
          </p>
        </div>

        <p className="mt-14 text-center text-[12px] uppercase tracking-[0.25em] text-ink-faint">How you design</p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {WAYS.map(({ id, mode, label, body, icon: Icon, tone }) => (
            <button
              key={id}
              onClick={() => navigate("/create", { state: { mode } })}
              className="group card-atelier flex flex-col items-start p-6 text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                style={{ color: tone, border: `1.5px solid ${tone}44`, background: `${tone}12` }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl uppercase tracking-tight text-ink">{label}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint transition-colors group-hover:text-ink">
                Try it
                <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-16 border-t border-[#351c45]/10 pt-14">
          <p className="text-center text-[12px] uppercase tracking-[0.25em] text-ink-faint">The FORMÉ marketplace</p>
          <h3 className="mx-auto mt-3 max-w-md text-center font-display text-2xl text-ink sm:text-3xl">
            Discover unique designs, made by people — not algorithms.
          </h3>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP.map(({ label, body, icon: Icon }, i) => (
              <div key={label} className="card-atelier relative flex flex-col p-5">
                <span className="font-display text-sm text-ink/25">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className="mt-3 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ color: PLUM, border: `1.5px solid ${GOLD}88`, background: `${GOLD}1a` }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 font-display text-base uppercase leading-tight tracking-tight text-ink">{label}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMÉ MOTTO — a brand statement, not startup-validation language. */}
      <div className="relative mx-auto mt-20 max-w-3xl px-5 text-center sm:mt-28 sm:px-8">
        <p className="font-display-heavy text-[clamp(1.9rem,7vw,3.6rem)] uppercase leading-[1.05] tracking-tight text-ink">
          Imagine it. Create it.
          <br />
          <span className="text-gradient-plum">Give it form.</span>
        </p>
      </div>

      {/* GIVE FEEDBACK — an explicit, hard-to-miss entry point into the one shared feedback form. */}
      <div className="relative mx-auto mt-20 max-w-2xl px-5 sm:mt-24 sm:px-8">
        <div
          className="grain grain-deep relative overflow-hidden rounded-[32px] px-7 py-12 text-center sm:px-12 sm:py-16"
          style={{ background: `linear-gradient(150deg, ${PLUM} 0%, #24102f 100%)` }}
        >
          <p className="text-[12px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>Your voice, our roadmap</p>
          <h2 className="mt-3 font-display-heavy text-[clamp(1.9rem,6vw,3rem)] uppercase leading-[0.95] tracking-tight text-[#faf4ea]">
            Help shape FORMÉ.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#faf4ea]/65">
            Tell us what you think. Your feedback helps us shape what FORMÉ becomes.
          </p>
          <button
            onClick={() => openFeedback()}
            className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: "#24102f" }}
          >
            Give Feedback
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-2xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[13px] uppercase tracking-[0.14em] text-ink-faint">Ready to create?</p>
          <GlowButton onClick={() => navigate("/create")}>
            Start Creating
            <IconArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}

function AboutCarousel() {
  const [index, setIndex] = useState(0);

  const slides = [
    <SlideUpload key="upload" active={index === 0} />,
    <SlideDraw key="draw" active={index === 1} />,
    <SlideMuseText key="muse" active={index === 2} />,
    <SlideMarketplace key="market" active={index === 3} />,
  ];

  return (
    <div className="overflow-hidden rounded-[32px] border border-[#d4af70]/25 bg-paper shadow-[0_40px_100px_-50px_rgba(53,28,69,0.35)]">
      <Carousel slides={slides} onIndexChange={setIndex} className="h-[720px] sm:h-[680px]" indicatorGutter={64} />
    </div>
  );
}
