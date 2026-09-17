const LIME = "var(--color-lime)";
const VIOLET = "var(--color-violet)";
const CORAL = "var(--color-coral)";

/**
 * Animated blurred color blobs — the "gradient mesh / holographic lighting"
 * backdrop for the landing page's void theme. Purely decorative and
 * non-interactive.
 *
 * `fixed` anchors the mesh to the viewport (ignores scroll) so it can sit
 * once at the top of the page and read as ambient studio lighting behind
 * every section, rather than being pinned to one section's content height.
 * Without it, the mesh is `absolute inset-0` and clipped by the nearest
 * `relative overflow-hidden` ancestor — use that for a section-scoped glow
 * (e.g. bookending the hero or the final CTA).
 */
export default function GradientMesh({ className = "", fixed = false }: { className?: string; fixed?: boolean }) {
  return (
    <div className={`pointer-events-none inset-0 -z-10 overflow-hidden ${fixed ? "fixed" : "absolute"} ${className}`} aria-hidden="true">
      <div
        className="animate-mesh-drift absolute -left-[10%] -top-[20%] h-[60vw] w-[60vw] max-h-[620px] max-w-[620px] rounded-full opacity-40 blur-[110px]"
        style={{ background: `radial-gradient(circle, ${VIOLET} 0%, transparent 70%)` }}
      />
      <div
        className="animate-mesh-drift-slow absolute -right-[15%] top-[5%] h-[50vw] w-[50vw] max-h-[560px] max-w-[560px] rounded-full opacity-30 blur-[110px]"
        style={{ background: `radial-gradient(circle, ${LIME} 0%, transparent 70%)` }}
      />
      <div
        className="animate-mesh-drift absolute bottom-[-25%] left-[20%] h-[45vw] w-[45vw] max-h-[520px] max-w-[520px] rounded-full opacity-25 blur-[120px] [animation-delay:-9s]"
        style={{ background: `radial-gradient(circle, ${CORAL} 0%, transparent 70%)` }}
      />
    </div>
  );
}
