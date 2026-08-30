import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../lib/onboarding";
import { track } from "../../lib/analytics";
import { IconClose } from "../icons";
import Carousel from "./Carousel";
import SlideUpload from "./SlideUpload";
import SlideDraw from "./SlideDraw";
import SlideMuseText from "./SlideMuseText";
import SlideMarketplace from "./SlideMarketplace";
import FinalScreen from "./FinalScreen";

type Stage = "carousel" | "final";

export default function Onboarding() {
  const { isOpen, close, complete } = useOnboarding();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("carousel");
  const [index, setIndex] = useState(0);
  const [finalActive, setFinalActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStage("carousel");
      setIndex(0);
      setFinalActive(false);
      track("landing_view", { onboarding: "opened" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleSkip = useCallback(() => {
    track("landing_view", { onboarding: "skipped", step: stage === "final" ? "final" : index });
    close();
    navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, navigate, stage, index]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleSkip]);

  const finish = (destination: "create" | "marketplace" | "scratch") => {
    track("start_creating", { onboarding: "completed", destination });
    complete();
    if (destination === "marketplace") navigate("/marketplace");
    else if (destination === "scratch") navigate("/create", { state: { mode: "scratch" } });
    else navigate("/create");
  };

  const goToFinal = () => {
    track("landing_view", { onboarding: "carousel_complete" });
    setStage("final");
    setFinalActive(false);
    window.setTimeout(() => setFinalActive(true), 30);
  };

  if (!isOpen) return null;

  const slides = [
    <SlideUpload key="upload" active={stage === "carousel" && index === 0} />,
    <SlideDraw key="draw" active={stage === "carousel" && index === 1} />,
    <SlideMuseText key="muse" active={stage === "carousel" && index === 2} />,
    <SlideMarketplace key="market" active={stage === "carousel" && index === 3} />,
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-ivory animate-fade-in" role="dialog" aria-modal="true" aria-label="Welcome to FORMÉ">
      <div className="grain absolute inset-0 opacity-60" />

      {stage === "carousel" ? (
        <Carousel
          slides={slides}
          onFinish={goToFinal}
          onSkip={handleSkip}
          onIndexChange={setIndex}
          resetKey={isOpen}
          className="h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        />
      ) : (
        <>
          <FinalScreen
            active={finalActive}
            onStartCreating={() => finish("create")}
            onExploreMarketplace={() => finish("marketplace")}
            onStartFromScratch={() => finish("scratch")}
          />
          <button
            onClick={handleSkip}
            aria-label="Close"
            className="absolute right-5 top-[max(16px,env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:text-ink sm:right-8"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
