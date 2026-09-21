import { IconArrowRight } from "../icons";

/**
 * The single implementation for every prev/next control across every
 * Carousel instance. Prev and Next differ only by `direction` (which flips
 * the icon and which edge the button sits on) and `label`/`text` — every
 * other visual property (size, border, radius, colour, hover/active state)
 * is identical between them so the pair always reads as one balanced pair,
 * never two different-looking buttons.
 */
interface CarouselArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  /** false hides the arrow (e.g. on the first/last slide) without shifting layout. */
  visible: boolean;
  label: string;
  /** Desktop pill text, e.g. "Previous" / "Next" / a custom finish label. */
  text: string;
}

const BASE =
  "z-20 flex items-center justify-center rounded-full border border-[#B8A88B] bg-[#FAF3E4] text-[#27231E] shadow-[0_6px_18px_-10px_rgba(39,35,30,0.35)] transition-all duration-200 hover:border-[#D5B875] hover:bg-[#D5B875] active:border-[#27231E] active:bg-[#27231E] active:text-[#D5B875] disabled:pointer-events-none disabled:opacity-0";

export default function CarouselArrow({ direction, onClick, disabled, visible, label, text }: CarouselArrowProps) {
  const isPrev = direction === "prev";
  const side = isPrev ? "left-3 sm:left-4" : "right-3 sm:right-4";
  const icon = <IconArrowRight className={`h-4 w-4 shrink-0 ${isPrev ? "rotate-180" : ""}`} />;

  return (
    <>
      {/* desktop: labeled pill, fixed min-width so Previous/Next always match */}
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`absolute top-1/2 hidden h-11 min-w-[112px] -translate-y-1/2 gap-2 px-4 text-[11px] font-medium uppercase tracking-[0.14em] sm:flex ${side} ${BASE} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ flexDirection: isPrev ? "row" : "row-reverse" }}
      >
        {icon}
        {text}
      </button>

      {/* mobile: icon-only circle, identical treatment */}
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`absolute top-1/2 h-10 w-10 -translate-y-1/2 sm:hidden ${side} ${BASE} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {icon}
      </button>
    </>
  );
}
