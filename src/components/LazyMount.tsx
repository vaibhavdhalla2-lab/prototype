import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts children only once the wrapper scrolls near the viewport, then
 * keeps them mounted permanently. Used to defer expensive work (photographic
 * garment canvases) that would otherwise all fire on first paint just
 * because they're further down the page.
 */
export default function LazyMount({
  children,
  rootMargin = "400px",
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : null}
    </div>
  );
}
