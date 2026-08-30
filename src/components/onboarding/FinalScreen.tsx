import { IconArrowRight } from "../icons";

interface FinalScreenProps {
  active: boolean;
  onStartCreating: () => void;
  onExploreMarketplace: () => void;
  onStartFromScratch: () => void;
}

export default function FinalScreen({ active, onStartCreating, onExploreMarketplace, onStartFromScratch }: FinalScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 sm:px-10">
      <p
        className="font-display text-4xl text-ink transition-all duration-700 sm:text-5xl"
        style={{ opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(14px)" }}
      >
        FORM<span className="text-clay">É</span>
      </p>

      <h1
        className="mt-6 max-w-md text-balance text-center font-display text-[clamp(2.2rem,7vw,3.6rem)] leading-[1.03] tracking-tight text-ink transition-all duration-700"
        style={{ opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(18px)", transitionDelay: "100ms" }}
      >
        Give your imagination form.
      </h1>

      <p
        className="mt-4 text-center text-[15px] text-ink-soft transition-all duration-700"
        style={{ opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(18px)", transitionDelay: "180ms" }}
      >
        Create something that doesn't exist yet.
      </p>

      <div
        className="mt-10 flex w-full max-w-xs flex-col items-center gap-3 transition-all duration-700"
        style={{ opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(18px)", transitionDelay: "260ms" }}
      >
        <button
          onClick={onStartCreating}
          aria-label="Start creating"
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory shadow-[0_20px_44px_-18px_rgba(26,23,18,0.5)] transition-transform hover:-translate-y-0.5"
        >
          Start Creating
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          onClick={onExploreMarketplace}
          className="w-full rounded-full border border-line py-3.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
        >
          Explore Marketplace
        </button>
        <button onClick={onStartFromScratch} className="mt-1 text-[12px] text-ink-faint underline underline-offset-4 hover:text-ink-soft">
          Already know what you want? Start from scratch
        </button>
      </div>

      <p
        className="mt-12 text-center text-[11px] uppercase tracking-[0.24em] text-ink-faint transition-opacity duration-700"
        style={{ opacity: active ? 1 : 0, transitionDelay: "340ms" }}
      >
        Imagine it. Wear it.
      </p>
    </div>
  );
}
