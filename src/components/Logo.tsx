/**
 * The FORMÉ monogram — two overlapping thin gold rings behind an interlocking
 * "F" / "É", per the brand board (circles = champagne #D4B883, letterforms =
 * charcoal on light backgrounds or ivory on dark ones).
 */
export function LogoMark({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  const letter = variant === "dark" ? "#2B2B2B" : "#FDF8F1";
  const ring = "#D4B883";
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="44" cy="60" r="30" fill="none" stroke={ring} strokeWidth="1.6" />
      <circle cx="76" cy="60" r="30" fill="none" stroke={ring} strokeWidth="1.6" />
      <text
        x="46"
        y="76"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="700"
        fontSize="42"
        fill={letter}
        textAnchor="middle"
      >
        F
      </text>
      <text
        x="76"
        y="76"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize="38"
        fill={letter}
        textAnchor="middle"
      >
        É
      </text>
    </svg>
  );
}

/** The mark paired with the FORMÉ wordmark, e.g. for the nav / footer / brand moments. */
export default function Logo({ className, markClassName, variant = "dark" }: { className?: string; markClassName?: string; variant?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark variant={variant} className={markClassName ?? "h-8 w-8"} />
      <span className="font-display tracking-tight">
        FORM<span style={{ color: "#D4B883" }}>É</span>
      </span>
    </span>
  );
}
