import type { ReactNode } from "react";

const PLUM = "#351c45";
const GOLD = "#e5c07b";
const PINK = "#ff6fae";

interface GlowButtonProps {
  onClick: () => void;
  children: ReactNode;
  /** "primary" (default) — plum fill, gold glow, for the main action. "secondary" — cream glass, pink border glow. */
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * The landing page's premium-playful CTA, replacing the flat black buttons
 * used elsewhere in the app. Fixed two-variant palette per the brand spec:
 * primary is plum-filled with a gold hover glow, secondary is a frosted
 * cream glass pill with a pink border glow — not a freeform "pick any
 * accent" button like the rest of the page's per-section colors.
 */
export default function GlowButton({ onClick, children, variant = "primary", className = "" }: GlowButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={`group inline-flex w-fit items-center gap-2.5 rounded-full px-7 py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5 ${
        isPrimary ? "text-[#fff4e6]" : "text-[#351c45]"
      } ${className}`}
      style={
        isPrimary
          ? {
              background: `linear-gradient(135deg, ${PLUM}, #4a2860)`,
              boxShadow: `0 0 0 1px ${PLUM}55, 0 14px 34px -12px ${PLUM}88`,
            }
          : {
              background: "rgba(255,255,255,0.55)",
              border: `1px solid ${PINK}55`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${PINK}66`,
            }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1.5px ${GOLD}, 0 18px 44px -10px ${PLUM}aa, 0 0 30px -8px ${GOLD}99`
          : `0 0 0 1.5px ${PINK}aa, 0 14px 36px -12px ${PINK}88`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPrimary
          ? `0 0 0 1px ${PLUM}55, 0 14px 34px -12px ${PLUM}88`
          : `0 0 0 1px rgba(255,255,255,0.4), 0 10px 28px -14px ${PINK}66`;
      }}
    >
      {children}
    </button>
  );
}
