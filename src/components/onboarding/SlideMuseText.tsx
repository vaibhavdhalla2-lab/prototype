import { useEffect, useRef, useState } from "react";
import { GarmentStage } from "../Garment";
import { IconSparkle, IconCheck } from "../icons";

type Phase = "typing" | "thinking" | "recommend" | "applied";

const PROMPT = "An oversized black hoodie with a futuristic Tokyo-inspired aesthetic, subtle graphics and a premium heavyweight feel.";

const RECS = ["Oversized fit", "Heavyweight cotton", "Washed black", "Subtle front graphic", "Large back detail"];

function FrontGraphic({ show }: { show: boolean }) {
  return (
    <g style={{ opacity: show ? 0.95 : 0, transition: "opacity 0.6s ease 0.1s" }}>
      <circle cx="180" cy="188" r="15" fill="none" stroke="#f1ead9" strokeWidth={2} />
      <circle cx="180" cy="188" r="4" fill="#f1ead9" />
      <text x="180" y="222" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" letterSpacing="3" fill="#f1ead9" opacity={0.85}>
        TOKYO
      </text>
    </g>
  );
}

export default function SlideMuseText({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState("");
  const typingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setPhase("typing");
      setTyped("");
      if (typingRef.current) window.clearInterval(typingRef.current);
      return;
    }

    let i = 0;
    typingRef.current = window.setInterval(() => {
      i += 3;
      setTyped(PROMPT.slice(0, i));
      if (i >= PROMPT.length) {
        if (typingRef.current) window.clearInterval(typingRef.current);
      }
    }, 22);

    const timers = [
      window.setTimeout(() => setPhase("thinking"), 1550),
      window.setTimeout(() => setPhase("recommend"), 2500),
      window.setTimeout(() => setPhase("applied"), 3600),
    ];
    return () => {
      timers.forEach(window.clearTimeout);
      if (typingRef.current) window.clearInterval(typingRef.current);
    };
  }, [active]);

  const applied = phase === "applied";
  const resolved = phase === "recommend" || applied;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-14 sm:px-14 sm:py-16">
      <p className="animate-fade-up mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-ink-faint [animation-delay:80ms]">
        You don't have to know how
      </p>
      <h1 className="animate-fade-up text-center font-display text-[clamp(2rem,6.8vw,3.4rem)] leading-[1.02] tracking-tight text-ink [animation-delay:140ms]">
        Tell MUSE what you're imagining.
      </h1>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-line bg-paper px-4 py-3.5 shadow-[0_20px_50px_-30px_rgba(26,23,18,0.35)]">
        <p className="min-h-[3.6em] text-[13px] leading-relaxed text-ink">
          {typed}
          {phase === "typing" && <span className="animate-pulse text-ink-faint">|</span>}
        </p>
      </div>

      <div className="mt-5 flex w-full max-w-sm items-start gap-4">
        <div className="relative aspect-square w-[34%] shrink-0 rounded-2xl border border-line-soft bg-paper p-3 shadow-[0_16px_40px_-26px_rgba(26,23,18,0.4)]">
          <GarmentStage
            garment="hoodie"
            colorHex={resolved ? "#17140f" : "#f1ead9"}
            view="front"
            fit={resolved ? "oversized" : "regular"}
            className="h-full w-full"
            frontOverlay={<FrontGraphic show={applied} />}
          />
        </div>

        <div className="flex-1 pt-0.5">
          {phase === "typing" && <p className="text-[12.5px] text-ink-faint">Describe the fit, fabric, colour, mood — anything.</p>}
          {phase === "thinking" && (
            <div className="flex items-center gap-2 text-[13px] text-ink-faint animate-fade-in">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay [animation-delay:300ms]" />
              </span>
              MUSE is imagining
            </div>
          )}
          {resolved && (
            <div className="animate-fade-up rounded-2xl border border-clay/30 bg-clay/[0.07] p-3">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-clay-deep">
                <IconSparkle className="h-3 w-3" /> Muse recommends
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {RECS.map((r) => (
                  <li key={r} className="text-[11.5px] leading-snug text-ink-soft">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-1.5 text-[12.5px] text-ink transition-opacity duration-500 ${applied ? "opacity-100" : "opacity-0"}`}>
        <IconCheck className="h-3.5 w-3.5 text-clay-deep" /> Your garment, shaped from a sentence
      </div>

      <p className="mt-5 max-w-xs text-center font-display text-lg italic leading-snug text-ink">
        "Your imagination is the starting point.
        <br />
        MUSE will help you shape it."
      </p>
    </div>
  );
}
