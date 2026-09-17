import type { ReactNode } from "react";

interface GlowButtonProps {
  tone: string;
  onClick: () => void;
  children: ReactNode;
  /** "solid" (default) — filled gradient, for primary actions. "ghost" — glass outline, for secondary actions. */
  variant?: "solid" | "ghost";
  className?: string;
}

/**
 * The landing page's premium CTA: a gradient-filled pill that glows on
 * hover instead of the flat black buttons the rest of the app still uses.
 * `tone` drives the gradient/glow color — pick from the void-theme accent
 * family (lime/violet/coral/gold) per the section it belongs to.
 */
export default function GlowButton({ tone, onClick, children, variant = "solid", className = "" }: GlowButtonProps) {
  const isSolid = variant === "solid";
  return (
    <button
      onClick={onClick}
      className={`group inline-flex w-fit items-center gap-2.5 rounded-full px-7 py-4 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5 ${
        isSolid ? "text-[#0d0d0f]" : "text-ivory"
      } ${className}`}
      style={
        isSolid
          ? {
              background: `linear-gradient(135deg, ${tone}, color-mix(in srgb, ${tone} 70%, white))`,
              boxShadow: `0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent), 0 12px 36px -10px ${tone}99`,
            }
          : {
              background: "rgba(255,255,255,0.04)",
              border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`,
              boxShadow: `0 0 24px -12px ${tone}88`,
            }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isSolid
          ? `0 0 0 1px color-mix(in srgb, ${tone} 60%, transparent), 0 16px 50px -8px ${tone}cc`
          : `0 0 34px -8px ${tone}cc`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isSolid
          ? `0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent), 0 12px 36px -10px ${tone}99`
          : `0 0 24px -12px ${tone}88`;
      }}
    >
      {children}
    </button>
  );
}
