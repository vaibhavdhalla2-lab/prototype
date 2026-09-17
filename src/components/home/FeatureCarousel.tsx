import { useState } from "react";
import Carousel from "../onboarding/Carousel";
import {
  SlideCreateFromScratch,
  SlideThreeWays,
  SlideDiscoverMarketplace,
  SlideCreateShareEarn,
  SlideFormeFuture,
} from "./HomeCarouselSlides";

/**
 * The homepage's "explain FORMÉ in one scroll" carousel — reuses the
 * onboarding Carousel shell (drag/swipe physics, arrows, dot+counter
 * indicator) with five homepage-specific slides instead of the onboarding
 * flow's four. No onFinish is passed: Next simply disables on the last
 * slide, since this is a browsing carousel, not a step-by-step flow.
 *
 * `activeIndex` is threaded down to each slide as `active` — the Carousel
 * shell keeps every slide mounted (it just translates the track), so
 * without this all five slides' photographic garment canvases would
 * composite on first paint instead of only the visible one.
 */
export default function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <Carousel
      className="h-[660px] sm:h-[560px] lg:h-[500px]"
      dark
      onIndexChange={setActiveIndex}
      slides={[
        <SlideCreateFromScratch key="create" active={activeIndex === 0} />,
        <SlideThreeWays key="ways" active={activeIndex === 1} />,
        <SlideDiscoverMarketplace key="discover" active={activeIndex === 2} />,
        <SlideCreateShareEarn key="earn" active={activeIndex === 3} />,
        <SlideFormeFuture key="future" active={activeIndex === 4} />,
      ]}
    />
  );
}
