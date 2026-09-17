const PEACH = "#ffb38a";
const PINK = "#ff6fae";
const GOLD = "#e5c07b";

/**
 * Animated blurred color blobs — the "soft gradient background / layered
 * color fields" backdrop for the landing page's playful-luxury theme.
 * Purely decorative and non-interactive.
 *
 * `variant="plum"` swaps in a palette that reads against the deep-plum
 * sections (marketplace preview, footer) instead of the cream/peach ones.
 *
 * `fixed` anchors the mesh to the viewport (ignores scroll) so it can sit
 * once at the top of the page and read as ambient atmosphere behind every
 * section, rather than being pinned to one section's content height.
 * Without it, the mesh is `absolute inset-0` and clipped by the nearest
 * `relative overflow-hidden` ancestor — use that for a section-scoped glow
 * (e.g. bookending the hero or the final CTA).
 */
export default function GradientMesh({
  className = "",
  fixed = false,
  variant = "warm",
}: {
  className?: string;
  fixed?: boolean;
  variant?: "warm" | "plum";
}) {
  const colors = variant === "plum" ? [PINK, GOLD, "#fff4e6"] : [PEACH, PINK, GOLD];
  const opacities = variant === "plum" ? [0.22, 0.16, 0.08] : [0.55, 0.4, 0.35];

  return (
    <div className={`pointer-events-none inset-0 -z-10 overflow-hidden ${fixed ? "fixed" : "absolute"} ${className}`} aria-hidden="true">
      <div
        className="animate-mesh-drift absolute -left-[10%] -top-[20%] h-[60vw] w-[60vw] max-h-[620px] max-w-[620px] rounded-full blur-[110px]"
        style={{ background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`, opacity: opacities[0] }}
      />
      <div
        className="animate-mesh-drift-slow absolute -right-[15%] top-[5%] h-[50vw] w-[50vw] max-h-[560px] max-w-[560px] rounded-full blur-[110px]"
        style={{ background: `radial-gradient(circle, ${colors[1]} 0%, transparent 70%)`, opacity: opacities[1] }}
      />
      <div
        className="animate-mesh-drift absolute bottom-[-25%] left-[20%] h-[45vw] w-[45vw] max-h-[520px] max-w-[520px] rounded-full blur-[120px] [animation-delay:-9s]"
        style={{ background: `radial-gradient(circle, ${colors[2]} 0%, transparent 70%)`, opacity: opacities[2] }}
      />
    </div>
  );
}
