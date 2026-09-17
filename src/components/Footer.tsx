import { Link, useLocation } from "react-router-dom";
import { COMING_SOON } from "../data/catalog";
import { IconLock } from "./icons";

export default function Footer() {
  const dark = useLocation().pathname === "/";

  return (
    <footer className={`border-t pb-24 pt-16 md:pb-16 ${dark ? "border-white/10 bg-[#201129]" : "border-line-soft bg-ivory-dim"}`}>
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-14">
          <p className={`mb-2 text-[11px] uppercase tracking-[0.3em] ${dark ? "text-[#fff4e6]/40" : "text-ink-faint"}`}>Coming soon</p>
          <p className={`mb-4 font-display text-lg italic ${dark ? "text-[#fff4e6]/70" : "text-ink-soft"}`}>
            Today, you design what you wear. Tomorrow, you might design anything.
          </p>
          <div className="flex flex-wrap gap-3">
            {COMING_SOON.map((item) => (
              <div
                key={item}
                className={`flex cursor-not-allowed items-center gap-2 rounded-full border px-4 py-2 text-[12px] uppercase tracking-[0.1em] ${
                  dark ? "border-white/10 bg-white/[0.04] text-[#fff4e6]/40" : "border-line bg-paper/60 text-ink-faint"
                }`}
              >
                <IconLock className="h-3 w-3" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-10 border-t pt-12 md:grid-cols-4 ${dark ? "border-white/10" : "border-line-soft"}`}>
          <div className="col-span-2 md:col-span-1">
            <p className={`font-display text-3xl ${dark ? "text-[#fff4e6]" : "text-ink"}`}>
              FORM<span className={dark ? "text-[#ff6fae]" : "text-clay"}>É</span>
            </p>
            <p className={`mt-3 text-sm uppercase tracking-[0.14em] ${dark ? "text-[#fff4e6]/60" : "text-ink-soft"}`}>Imagine it. Wear it.</p>
            <p className={`mt-1 font-display italic ${dark ? "text-[#fff4e6]/40" : "text-ink-faint"}`}>"Give your imagination form."</p>
          </div>

          <div>
            <p className={`mb-4 text-[11px] uppercase tracking-[0.2em] ${dark ? "text-[#fff4e6]/40" : "text-ink-faint"}`}>Explore</p>
            <ul className={`space-y-3 text-sm ${dark ? "text-[#fff4e6]/60" : "text-ink-soft"}`}>
              <li><Link to="/create" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>Start Creating</Link></li>
              <li><Link to="/marketplace" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>Marketplace</Link></li>
              <li><Link to="/profile" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>My Creations</Link></li>
            </ul>
          </div>

          <div>
            <p className={`mb-4 text-[11px] uppercase tracking-[0.2em] ${dark ? "text-[#fff4e6]/40" : "text-ink-faint"}`}>Studio</p>
            <ul className={`space-y-3 text-sm ${dark ? "text-[#fff4e6]/60" : "text-ink-soft"}`}>
              <li><Link to="/about" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>About FORMÉ</Link></li>
              <li><Link to="/create" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>Materials Guide</Link></li>
              <li><Link to="/marketplace" className={dark ? "hover:text-[#fff4e6]" : "hover:text-ink"}>Creator Rewards</Link></li>
            </ul>
          </div>

          <div>
            <p className={`mb-4 text-[11px] uppercase tracking-[0.2em] ${dark ? "text-[#fff4e6]/40" : "text-ink-faint"}`}>Categories</p>
            <ul className={`space-y-3 text-sm ${dark ? "text-[#fff4e6]/60" : "text-ink-soft"}`}>
              <li>T-Shirts</li>
              <li>Hoodies</li>
              <li>Caps</li>
            </ul>
          </div>
        </div>

        <div
          className={`mt-14 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${
            dark ? "border-white/10 text-[#fff4e6]/40" : "border-line-soft text-ink-faint"
          }`}
        >
          <p>FORMÉ is currently a prototype. Your feedback helps shape what comes next.</p>
          <p>© {new Date().getFullYear()} FORMÉ — a design experiment.</p>
        </div>
      </div>
    </footer>
  );
}
