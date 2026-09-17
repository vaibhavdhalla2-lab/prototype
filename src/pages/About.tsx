import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "../components/icons";
import GradientMesh from "../components/GradientMesh";
import GlowButton from "../components/GlowButton";
import Carousel from "../components/onboarding/Carousel";
import SlideUpload from "../components/onboarding/SlideUpload";
import SlideDraw from "../components/onboarding/SlideDraw";
import SlideMuseText from "../components/onboarding/SlideMuseText";
import SlideMarketplace from "../components/onboarding/SlideMarketplace";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="grain relative pb-24 pt-14 sm:pt-20">
      <GradientMesh fixed />
      <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
        <p className="mb-4 text-center text-[12px] uppercase tracking-[0.3em]" style={{ color: "#d4af70" }}>About FORMÉ</p>
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

      <div className="relative mx-auto mt-16 max-w-2xl px-5 sm:px-8">
        <div className="space-y-5 text-[15.5px] leading-relaxed text-ink-soft">
          <p>
            Everything you design can be kept private, saved as a draft, or published to the marketplace, where
            other people can discover it, remix it, and make it their own. If your design sells, you earn a share.
          </p>
        </div>

        <div className="mt-10 border-l-2 pl-6" style={{ borderColor: "#d4af70" }}>
          <p className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
            The goal isn't to sell you a finished platform. It's to find out whether this is worth building at
            all — and your feedback is what decides that.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
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
      <Carousel slides={slides} onIndexChange={setIndex} className="h-[620px] sm:h-[600px]" />
    </div>
  );
}
