import { IconArrowRight } from "../icons";

/**
 * The single implementation for every prev/next control across every
 * Carousel instance. Prev and Next differ only by `direction` (which flips
 * the icon) and `label`/`text` — every other visual property (size, border,
 * radius, colour, hover/active state) is identical between them so the pair
 * always reads as one balanced pair, never two different-looking buttons.
 *
 * Deliberately NOT absolutely positioned — Carousel.tsx places this as a
 * normal flex sibling next to the slide viewport (or inline with the dots
 * on narrow screens), so it can never sit on top of slide content.
 */
interface CarouselArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  label: string;
  /** Pill text shown next to the icon, e.g. "Previous" / "Next". Omit for an icon-only circle (used inline with the dots on narrow screens). */
  text?: string;
  /** Must include a complete display pair (e.g. "inline-flex lg:hidden" or "hidden lg:inline-flex") — see the note on BASE below. */
  className: string;
}

/**
 * Deliberately no `display` utility here (not even `inline-flex`) — callers supply the full
 * display pair themselves (e.g. `inline-flex lg:hidden` or `hidden lg:inline-flex`). An
 * unprefixed `inline-flex` living here would sit at the same specificity as a caller's
 * unprefixed `hidden`/`inline-flex`, and cascade order (not intent) would decide the winner —
 * exactly the bug that shipped once already.
 */
const BASE =
  "items-center justify-center gap-2 rounded-full border border-[#CDBFAD] bg-[#FAF7F1] text-[#29231D] shadow-[0_6px_18px_-10px_rgba(70,55,35,0.25)] transition-all duration-200 hover:border-[#c8a96b] hover:bg-[#EEE0C6] active:bg-[#e6d5b0] disabled:pointer-events-none disabled:opacity-30";

export default function CarouselArrow({ direction, onClick, disabled, label, text, className }: CarouselArrowProps) {
  const isPrev = direction === "prev";
  const icon = <IconArrowRight className={`h-4 w-4 shrink-0 ${isPrev ? "rotate-180" : ""}`} />;

  // Icon-only circle everywhere by default — costs the flanking flex layout as little width as
  // possible on tablet widths. Only expands into a labeled pill at lg+, where there's reliably
  // enough spare width for it without squeezing the slide content between it and its twin.
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${BASE} h-9 w-9 sm:h-10 sm:w-10 ${text ? "lg:h-11 lg:w-auto lg:min-w-[112px] lg:px-4 lg:text-[11px] lg:font-medium lg:uppercase lg:tracking-[0.14em]" : ""} ${className}`}
      style={text ? { flexDirection: isPrev ? "row" : "row-reverse" } : undefined}
    >
      {icon}
      {text && <span className="hidden lg:inline">{text}</span>}
    </button>
  );
}
