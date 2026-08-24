import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IconMenu, IconClose, IconStore, IconUser, IconPlus } from "./icons";

const LINK_CLS = ({ isActive }: { isActive: boolean }) =>
  `relative py-1 text-[13px] tracking-[0.14em] uppercase transition-colors ${
    isActive ? "text-ink" : "text-ink-soft hover:text-ink"
  } after:absolute after:left-0 after:-bottom-1 after:h-px after:bg-ink after:transition-all ${
    isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
  }`;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled ? "bg-paper/90 backdrop-blur-md border-b border-line-soft" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
          <NavLink to="/" className="font-display text-2xl tracking-tight text-ink" onClick={() => setMobileOpen(false)}>
            FORM<span className="text-clay">É</span>
          </NavLink>

          <nav className="hidden items-center gap-9 md:flex">
            <NavLink to="/create" className={LINK_CLS}>
              Start Creating
            </NavLink>
            <NavLink to="/marketplace" className={LINK_CLS}>
              Marketplace
            </NavLink>
            <NavLink to="/profile" className={LINK_CLS}>
              My Creations
            </NavLink>
            <NavLink to="/about" className={LINK_CLS}>
              About
            </NavLink>
          </nav>

          <div className="hidden md:block">
            <button
              onClick={() => navigate("/create")}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(26,23,18,0.5)]"
            >
              Create From Scratch
              <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          <button className="md:hidden text-ink" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="animate-fade-in border-t border-line-soft bg-paper px-6 py-6 md:hidden">
            <div className="flex flex-col gap-5">
              <NavLink to="/create" onClick={() => setMobileOpen(false)} className="text-lg font-display">
                Start Creating
              </NavLink>
              <NavLink to="/marketplace" onClick={() => setMobileOpen(false)} className="text-lg font-display">
                Marketplace
              </NavLink>
              <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="text-lg font-display">
                My Creations
              </NavLink>
              <NavLink to="/about" onClick={() => setMobileOpen(false)} className="text-lg font-display">
                About
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line-soft bg-paper/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        <NavLink to="/marketplace" className="flex flex-col items-center gap-1 px-4 py-1 text-ink-soft [&.active]:text-ink">
          {({ isActive }) => (
            <>
              <IconStore className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink-faint"}`} />
              <span className={`text-[10px] uppercase tracking-wide ${isActive ? "text-ink" : "text-ink-faint"}`}>Marketplace</span>
            </>
          )}
        </NavLink>

        <NavLink to="/create" className="-mt-6 flex flex-col items-center gap-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-ivory shadow-[0_10px_24px_-8px_rgba(26,23,18,0.6)] active:scale-95 transition-transform">
            <IconPlus className="h-6 w-6" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink">Create</span>
        </NavLink>

        <NavLink to="/profile" className="flex flex-col items-center gap-1 px-4 py-1">
          {({ isActive }) => (
            <>
              <IconUser className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink-faint"}`} />
              <span className={`text-[10px] uppercase tracking-wide ${isActive ? "text-ink" : "text-ink-faint"}`}>Profile</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
}
