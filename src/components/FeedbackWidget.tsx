import { useEffect, useRef, useState } from "react";
import { useFeedback } from "../lib/feedback";
import { track } from "../lib/analytics";
import { submitFeedback, type FeedbackFormData } from "../lib/feedbackApi";
import { IconClose, IconCheck, IconStar } from "./icons";

const USAGE_OPTIONS = ["Definitely would", "Probably would", "Maybe", "Probably wouldn't", "Definitely wouldn't"];
const FEATURE_OPTIONS = [
  "Design from scratch",
  "Upload an image",
  "Tell MUSE what I want",
  "Draw my own design",
  "Choose materials",
  "Remix existing designs",
  "Marketplace",
  "Create and earn from designs",
  "Other",
];
const INTENT_OPTIONS = ["Definitely", "Probably", "Maybe", "Probably not", "No"];
const YES_NO_OPTIONS = ["Yes", "No"];
const OUTPUT_OPTIONS = ["T-Shirts", "Hoodies", "Caps", "Mobile Covers", "Posters", "Mugs"];

const TEXT_MAX = 100;
const AREA_MAX = 600;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: FeedbackFormData = {
  name: "",
  email: "",
  overallRating: null,
  usageIntent: null,
  favouriteFeatures: [],
  purchaseIntent: null,
  creatorIntent: null,
  easeOfUse: null,
  exciteMoreThanClothing: null,
  excitingOutputs: [],
  likedMost: "",
  improvement: "",
  additionalFeedback: "",
  company: "",
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

function Stars({ value, onChange, ariaLabel }: { value: number | null; onChange: (n: number) => void; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className="p-0.5"
        >
          <IconStar filled={n <= active} className={`h-6 w-6 transition-colors ${n <= active ? "text-clay-deep" : "text-line"}`} />
        </button>
      ))}
    </div>
  );
}

function RadioList({ options, value, onChange, name }: { options: string[]; value: string | null; onChange: (v: string) => void; name: string }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[13.5px] transition-colors ${
            value === opt ? "border-ink bg-ivory-dim text-ink" : "border-line text-ink-soft hover:border-ink-soft"
          }`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${value === opt ? "border-ink" : "border-line-soft"}`}>
            {value === opt && <span className="h-2 w-2 rounded-full bg-ink" />}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

type Stage = "form" | "submitting" | "success" | "error";

export default function FeedbackWidget() {
  const { isOpen, open, close, prefill } = useFeedback();
  const [stage, setStage] = useState<Stage>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<FeedbackFormData>(EMPTY);
  const submittingRef = useRef(false);

  // Carries in whatever the opener already knows (e.g. a homepage Yes/No
  // click) without disturbing anything the person has already typed.
  useEffect(() => {
    if (isOpen && prefill) setData((d) => ({ ...d, ...prefill }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const set = <K extends keyof FeedbackFormData>(key: K, value: FeedbackFormData[K]) => setData((d) => ({ ...d, [key]: value }));

  const emailValid = data.email.trim() === "" || EMAIL_RE.test(data.email.trim());
  const requiredFilled =
    data.overallRating !== null && data.usageIntent !== null && data.purchaseIntent !== null && data.creatorIntent !== null && data.easeOfUse !== null;
  const canSubmit = requiredFilled && emailValid && stage !== "submitting";

  const reset = () => {
    setStage("form");
    setErrorMessage("");
    setData(EMPTY);
  };

  const handleClose = () => {
    close();
    window.setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setStage("submitting");

    const result = await submitFeedback(data);

    submittingRef.current = false;
    if (result.ok) {
      track("feedback_submitted", {
        overallRating: data.overallRating,
        usageIntent: data.usageIntent,
        favouriteFeatures: data.favouriteFeatures,
        purchaseIntent: data.purchaseIntent,
        creatorIntent: data.creatorIntent,
        easeOfUse: data.easeOfUse,
        exciteMoreThanClothing: data.exciteMoreThanClothing,
        excitingOutputs: data.excitingOutputs,
      });
      setStage("success");
    } else {
      setErrorMessage(result.message);
      setStage("error");
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => open()}
          className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-[#d4af70]/30 bg-paper px-3 py-4 shadow-[0_8px_24px_-12px_rgba(36, 31, 26,0.3)] transition-all hover:pr-4 hover:bg-[#c8a96b] hover:text-[#241f1a] md:flex"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">Tell Us What You Think</span>
        </button>
      )}

      {!isOpen && (
        <button
          data-mobile-chrome
          onClick={() => open()}
          aria-label="Tell us what you think"
          className="fixed bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-[0_8px_20px_-10px_rgba(26,23,18,0.4)] md:hidden"
        >
          <span className="font-display text-lg leading-none">?</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center animate-fade-in" onClick={handleClose}>
          <div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-7 shadow-2xl animate-scale-in sm:rounded-3xl sm:p-9"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute right-5 top-5 text-ink-soft hover:text-ink" aria-label="Close">
              <IconClose className="h-5 w-5" />
            </button>

            {stage === "success" ? (
              <div className="flex flex-col items-center py-10 text-center animate-fade-up">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a96b] text-[#241f1a]">
                  <IconCheck className="h-6 w-6" />
                </div>
                <p className="font-display text-3xl text-ink">Thank you.</p>
                <p className="mt-2 max-w-xs text-sm text-ink-soft">Your feedback is helping us shape FORMÉ.</p>
                <p className="mt-4 font-display italic text-ink-faint">"Give your imagination form."</p>
                <button
                  onClick={handleClose}
                  className="mt-8 rounded-full bg-[#c8a96b] px-7 py-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#241f1a] hover:opacity-90"
                >
                  Back To FORMÉ
                </button>
              </div>
            ) : stage === "error" ? (
              <div className="flex flex-col items-center py-10 text-center animate-fade-up">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-clay/40 bg-clay/[0.08] text-clay-deep">
                  <IconClose className="h-6 w-6" />
                </div>
                <p className="font-display text-3xl text-ink">Something went wrong.</p>
                <p className="mt-2 max-w-xs text-sm text-ink-soft">Please try again — nothing you entered has been lost.</p>
                {errorMessage && <p className="mt-2 max-w-xs text-[12px] text-ink-faint">{errorMessage}</p>}
                <div className="mt-8 flex gap-2.5">
                  <button
                    onClick={() => setStage("form")}
                    className="rounded-full bg-[#c8a96b] px-7 py-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#241f1a] hover:opacity-90"
                  >
                    Try Again
                  </button>
                  <button onClick={handleClose} className="rounded-full border border-line px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] text-ink-soft hover:border-ink">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-display text-2xl text-ink sm:text-3xl">Tell us what you think.</p>
                <p className="mt-2 text-sm text-ink-soft">
                  We're building FORMÉ from the ground up. Two minutes of your honest reaction shapes what we build next.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="mt-8 space-y-7"
                >
                  {/* honeypot — hidden from real users */}
                  <input
                    type="text"
                    value={data.company}
                    onChange={(e) => set("company", e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[13px] font-medium text-ink">What's your name?</label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => set("name", e.target.value)}
                        maxLength={TEXT_MAX}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-medium text-ink">Email address</label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => set("email", e.target.value)}
                        maxLength={TEXT_MAX}
                        placeholder="you@email.com"
                        className={`w-full rounded-xl border bg-ivory px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
                          emailValid ? "border-line focus:border-ink" : "border-clay/60 focus:border-clay"
                        }`}
                      />
                      {!emailValid && <p className="mt-1.5 text-[12px] text-clay-deep">Enter a valid email address.</p>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">How would you rate your overall FORMÉ experience?</p>
                    <Stars value={data.overallRating} onChange={(n) => set("overallRating", n)} ariaLabel="Overall experience rating" />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">If FORMÉ were available today, how likely would you be to use it?</p>
                    <RadioList name="Usage intent" options={USAGE_OPTIONS} value={data.usageIntent} onChange={(v) => set("usageIntent", v)} />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">What interested you most?</p>
                    <div className="flex flex-wrap gap-2">
                      {FEATURE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("favouriteFeatures", toggle(data.favouriteFeatures, opt))}
                          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                            data.favouriteFeatures.includes(opt) ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">If you designed something you genuinely loved, would you buy it?</p>
                    <RadioList name="Purchase intent" options={INTENT_OPTIONS} value={data.purchaseIntent} onChange={(v) => set("purchaseIntent", v)} />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">
                      Would you publish your designs on FORMÉ for others to discover and potentially buy?
                    </p>
                    <RadioList name="Creator intent" options={INTENT_OPTIONS} value={data.creatorIntent} onChange={(v) => set("creatorIntent", v)} />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">How easy was it to understand how FORMÉ works?</p>
                    <Stars value={data.easeOfUse} onChange={(n) => set("easeOfUse", n)} ariaLabel="Ease of use rating" />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">Will FORMÉ products excite you more than clothing?</p>
                    <RadioList
                      name="Excite more than clothing"
                      options={YES_NO_OPTIONS}
                      value={data.exciteMoreThanClothing}
                      onChange={(v) => set("exciteMoreThanClothing", v)}
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">Which FORMÉ output would excite you the most?</p>
                    <div className="flex flex-wrap gap-2">
                      {OUTPUT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("excitingOutputs", toggle(data.excitingOutputs, opt))}
                          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                            data.excitingOutputs.includes(opt) ? "border-[#241f1a] bg-[#c8a96b] text-[#241f1a]" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-ink">What did you like most about FORMÉ?</label>
                    <textarea
                      value={data.likedMost}
                      onChange={(e) => set("likedMost", e.target.value)}
                      rows={2}
                      maxLength={AREA_MAX}
                      placeholder="Tell us anything..."
                      className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-ink">What would you change or improve?</label>
                    <textarea
                      value={data.improvement}
                      onChange={(e) => set("improvement", e.target.value)}
                      rows={2}
                      maxLength={AREA_MAX}
                      placeholder="Tell us anything..."
                      className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-ink">Anything else you want to tell us?</label>
                    <textarea
                      value={data.additionalFeedback}
                      onChange={(e) => set("additionalFeedback", e.target.value)}
                      rows={2}
                      maxLength={AREA_MAX}
                      placeholder="Tell us anything..."
                      className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96b] py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#241f1a] transition-opacity disabled:opacity-30 hover:opacity-90"
                  >
                    {stage === "submitting" ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
