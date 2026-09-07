import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "../components/icons";
import Carousel from "../components/onboarding/Carousel";
import SlideUpload from "../components/onboarding/SlideUpload";
import SlideDraw from "../components/onboarding/SlideDraw";
import SlideMuseText from "../components/onboarding/SlideMuseText";
import SlideMarketplace from "../components/onboarding/SlideMarketplace";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="pb-24 pt-14 sm:pt-20">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <p className="mb-4 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint">About FORMÉ</p>
        <h1 className="text-center font-display text-4xl leading-tight text-ink sm:text-5xl">
          Give your imagination form.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-[16px] leading-relaxed text-ink-soft">
          FORMÉ is a working prototype, not a finished product — we're testing whether people actually want a
          platform where anyone can design and create their own physical clothing, no design experience required.
          Here's how it works.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-3xl px-2 sm:px-8">
        <AboutCarousel />
      </div>

      <div className="mx-auto mt-14 max-w-2xl px-5 sm:px-8">
        <div className="space-y-5 text-[15.5px] leading-relaxed text-ink-soft">
          <p>
            Everything you design can be kept private, saved as a draft, or published to the marketplace, where
            other people can discover it, remix it, and make it their own. If your design sells, you earn a share.
          </p>
          <p className="font-display text-xl italic text-ink">
            The goal isn't to sell you a finished platform. It's to find out whether this is worth building at
            all — and your feedback is what decides that.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-[13px] uppercase tracking-[0.14em] text-ink-faint">Ready to create?</p>
          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory transition-transform hover:-translate-y-0.5"
          >
            Start Creating
            <IconArrowRight className="h-4 w-4" />
          </button>
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
    <div className="overflow-hidden rounded-[32px] border border-line-soft bg-paper shadow-[0_40px_100px_-50px_rgba(26,23,18,0.35)]">
      <Carousel slides={slides} onIndexChange={setIndex} className="h-[620px] sm:h-[600px]" />
    </div>
  );
}
