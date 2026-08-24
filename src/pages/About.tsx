import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "../components/icons";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8 sm:py-28">
      <p className="mb-4 text-center text-[12px] uppercase tracking-[0.3em] text-ink-faint">About</p>
      <h1 className="text-center font-display text-4xl leading-tight text-ink sm:text-5xl">
        You don't have to be a fashion designer.
        <br />
        You just have to imagine it.
      </h1>

      <div className="mt-12 space-y-6 text-[17px] leading-relaxed text-ink-soft">
        <p>
          FORMÉ is a working prototype, not a finished product. We're testing a simple question: would people
          actually want a platform where they can design and create their own physical clothing — without needing
          any design experience at all?
        </p>
        <p>
          Right now that means three categories — t-shirts, hoodies and caps — and three ways in: start from a
          blank canvas, upload an image, or describe an idea in your own words. MUSE, our design assistant, helps
          translate what you're imagining into materials, fits and colours that actually work together.
        </p>
        <p>
          Everything you design can be kept private, saved as a draft, or published to the marketplace, where
          other people can discover it, remix it, and make it their own. If your design sells, you earn a share.
        </p>
        <p className="font-display text-xl italic text-ink">
          The goal isn't to sell you a finished platform. It's to find out whether this is worth building at all —
          and your feedback is what decides that.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <button
          onClick={() => navigate("/create")}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ivory"
        >
          Start Creating
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
