import { useState } from "react";
import { useFeedback } from "../lib/feedback";
import { track } from "../lib/analytics";
import { IconClose, IconCheck } from "./icons";

const EXCITEMENT_OPTIONS = [
  "Creating from scratch",
  "Uploading an image",
  "MUSE recommendations",
  "Material guidance",
  "Marketplace",
  "Remixing",
  "Seeing the realistic garment",
  "Other",
];

const BLOCKER_OPTIONS = [
  "Price",
  "Delivery time",
  "Quality uncertainty",
  "Too complicated",
  "Not enough customization",
  "I'd rather buy ready-made clothing",
  "Other",
];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export default function FeedbackWidget() {
  const { isOpen, open, close } = useFeedback();
  const [submitted, setSubmitted] = useState(false);

  const [likelihood, setLikelihood] = useState<number | null>(null);
  const [excitement, setExcitement] = useState<string[]>([]);
  const [wouldBuy, setWouldBuy] = useState<"yes" | "maybe" | "no" | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [openText, setOpenText] = useState("");

  const reset = () => {
    setSubmitted(false);
    setLikelihood(null);
    setExcitement([]);
    setWouldBuy(null);
    setBlockers([]);
    setOpenText("");
  };

  const handleClose = () => {
    close();
    setTimeout(reset, 300);
  };

  const canSubmit = likelihood !== null && wouldBuy !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    track("feedback_submitted", { likelihood, excitement, wouldBuy, blockers, openText });
    setSubmitted(true);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={open}
          className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-line bg-paper px-3 py-4 shadow-[0_8px_24px_-12px_rgba(26,23,18,0.35)] transition-all hover:pr-4 hover:bg-ink hover:text-ivory md:flex"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">How do you feel?</span>
        </button>
      )}

      {!isOpen && (
        <button
          data-mobile-chrome
          onClick={open}
          aria-label="Give feedback"
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

            {!submitted ? (
              <>
                <p className="font-display text-2xl text-ink sm:text-3xl">How did that feel?</p>
                <p className="mt-2 text-sm text-ink-soft">
                  We're building FORMÉ from the ground up. Tell us what worked, what didn't, and what you'd want next.
                </p>

                <div className="mt-8 space-y-8">
                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">How likely would you be to use FORMÉ?</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setLikelihood(n)}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm transition-all ${
                            likelihood === n ? "border-ink bg-ink text-ivory scale-105" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-ink-faint">
                      <span>Not at all</span>
                      <span>Absolutely</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">What did you find most exciting?</p>
                    <div className="flex flex-wrap gap-2">
                      {EXCITEMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setExcitement((s) => toggle(s, opt))}
                          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                            excitement.includes(opt) ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">Would you actually buy something you designed?</p>
                    <div className="flex gap-2">
                      {(["yes", "maybe", "no"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setWouldBuy(v)}
                          className={`flex-1 rounded-xl border py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
                            wouldBuy === v ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">What would stop you from using this?</p>
                    <div className="flex flex-wrap gap-2">
                      {BLOCKER_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setBlockers((s) => toggle(s, opt))}
                          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                            blockers.includes(opt) ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink-soft"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-ink">
                      What would make FORMÉ something you would genuinely want to use?
                    </p>
                    <textarea
                      value={openText}
                      onChange={(e) => setOpenText(e.target.value)}
                      rows={3}
                      placeholder="Tell us anything..."
                      className="w-full resize-none rounded-xl border border-line bg-ivory px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="mt-8 w-full rounded-full bg-ink py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory transition-opacity disabled:opacity-30 hover:opacity-90"
                >
                  Submit Feedback
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-10 text-center animate-fade-up">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-ivory">
                  <IconCheck className="h-6 w-6" />
                </div>
                <p className="font-display text-3xl text-ink">Thank you.</p>
                <p className="mt-2 max-w-xs text-sm text-ink-soft">You're helping shape what FORMÉ becomes.</p>
                <button onClick={handleClose} className="mt-8 rounded-full border border-line px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] text-ink hover:border-ink">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
