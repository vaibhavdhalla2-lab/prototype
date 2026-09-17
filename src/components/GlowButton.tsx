import type { ReactNode } from "react";

const PLUM = "#351c45";
const GOLD = "#d4af70";
const IVORY = "#faf4ea";

interface GlowButtonProps {
  onClick: () => void;
  children: ReactNode;
  /** "primary" (default) — plum fill, gold text/glow. "secondary" — ivory fill, plum border. */
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * The atelier's premium CTA, used sitewide in place of plain black buttons.
 * Fixed two-variant palette per the brand spec: primary is plum-filled with
 * a gold hover glow, secondary is an ivory pill with a plum border — not a
 * freeform "pick any accent" button.
 */
export default function GlowButton({ onClick, children, variant = "primary", className = "" }: GlowButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5 ${
        isPrimary ? "text-[#d4af70]" : "text-[#351c45]"
      } ${className}`}
      style={
        isPrimary
          ? {
              background: `linear-gradient(135deg, ${PLUM}, #4a2860)`,
              boxShadow: `0 0 0 1px ${PLUM}55, 0 14px 34px -12px ${PLUM}88`,
            }
          : {
              background: IVORY,
              border: `1px solid ${PLUM}55`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${PLUM}33`,
            }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1.5px ${GOLD}, 0 18px 44px -10px ${PLUM}aa, 0 0 30px -8px ${GOLD}99`
          : `0 0 0 1.5px ${PLUM}aa, 0 14px 36px -12px ${PLUM}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1px ${PLUM}55, 0 14px 34px -12px ${PLUM}88`
          : `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${PLUM}33`;
      }}
    >
      {children}
    </button>
  );
}
