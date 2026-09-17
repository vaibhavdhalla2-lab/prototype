import { Link } from "react-router-dom";
import { COMING_SOON } from "../data/catalog";
import { IconLock } from "./icons";

export default function Footer() {
  return (
    <footer className="grain grain-deep border-t border-white/10 bg-[#24102f] pb-24 pt-16 md:pb-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-14">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[#faf4ea]/40">Coming soon</p>
          <p className="mb-4 font-display text-lg italic text-[#faf4ea]/70">
            Today, you design what you wear. Tomorrow, you might design anything.
          </p>
          <div className="flex flex-wrap gap-3">
            {COMING_SOON.map((item) => (
              <div
                key={item}
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-[#faf4ea]/40"
              >
                <IconLock className="h-3 w-3" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 border-t border-white/10 pt-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-3xl text-[#faf4ea]">
              FORM<span className="text-[#d4af70]">É</span>
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[#faf4ea]/60">Imagine it. Wear it.</p>
            <p className="mt-1 font-display italic text-[#faf4ea]/40">"Give your imagination form."</p>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[#faf4ea]/40">Explore</p>
            <ul className="space-y-3 text-sm text-[#faf4ea]/60">
              <li><Link to="/create" className="hover:text-[#faf4ea]">Start Creating</Link></li>
              <li><Link to="/marketplace" className="hover:text-[#faf4ea]">Marketplace</Link></li>
              <li><Link to="/profile" className="hover:text-[#faf4ea]">My Creations</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[#faf4ea]/40">Studio</p>
            <ul className="space-y-3 text-sm text-[#faf4ea]/60">
              <li><Link to="/about" className="hover:text-[#faf4ea]">About FORMÉ</Link></li>
              <li><Link to="/create" className="hover:text-[#faf4ea]">Materials Guide</Link></li>
              <li><Link to="/marketplace" className="hover:text-[#faf4ea]">Creator Rewards</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[#faf4ea]/40">Categories</p>
            <ul className="space-y-3 text-sm text-[#faf4ea]/60">
              <li>T-Shirts</li>
              <li>Hoodies</li>
              <li>Caps</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-[#faf4ea]/40 sm:flex-row sm:items-center sm:justify-between">
          <p>FORMÉ is currently a prototype. Your feedback helps shape what comes next.</p>
          <p>© {new Date().getFullYear()} FORMÉ — a design experiment.</p>
        </div>
      </div>
    </footer>
  );
}
