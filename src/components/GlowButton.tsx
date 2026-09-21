import type { ReactNode } from "react";

const CHAMPAGNE = "#c8a96b";
const CHAMPAGNE_DEEP = "#ad8c56";
const ESPRESSO = "#241f1a";
const IVORY = "#faf4ea";

interface GlowButtonProps {
  onClick: () => void;
  children: ReactNode;
  /** "primary" (default) — champagne-gold fill, espresso text. "secondary" — ivory fill, warm border. */
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * The atelier's premium CTA, used sitewide in place of plain black buttons.
 * Fixed two-variant palette per the brand spec: primary is a champagne-gold
 * fill with very dark text, secondary is an ivory pill with a warm border —
 * not a freeform "pick any accent" button.
 */
export default function GlowButton({ onClick, children, variant = "primary", className = "" }: GlowButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5 ${
        isPrimary ? "text-[#241f1a]" : "text-[#241f1a]"
      } ${className}`}
      style={
        isPrimary
          ? {
              background: `linear-gradient(135deg, ${CHAMPAGNE}, ${CHAMPAGNE_DEEP})`,
              boxShadow: `0 0 0 1px ${CHAMPAGNE_DEEP}55, 0 14px 34px -12px ${ESPRESSO}55`,
            }
          : {
              background: IVORY,
              border: `1px solid ${CHAMPAGNE_DEEP}55`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${ESPRESSO}22`,
            }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1.5px ${ESPRESSO}, 0 18px 44px -10px ${ESPRESSO}66, 0 0 30px -10px ${CHAMPAGNE}aa`
          : `0 0 0 1.5px ${CHAMPAGNE_DEEP}aa, 0 14px 36px -12px ${ESPRESSO}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1px ${CHAMPAGNE_DEEP}55, 0 14px 34px -12px ${ESPRESSO}55`
          : `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${ESPRESSO}22`;
      }}
    >
      {children}
    </button>
  );
}
