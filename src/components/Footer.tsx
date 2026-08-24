import { Link } from "react-router-dom";
import { COMING_SOON } from "../data/catalog";
import { IconLock } from "./icons";

export default function Footer() {
  return (
    <footer className="border-t border-line-soft bg-ivory-dim pb-24 pt-16 md:pb-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-14">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-faint">Coming soon</p>
          <div className="flex flex-wrap gap-3">
            {COMING_SOON.map((item) => (
              <div
                key={item}
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-line bg-paper/60 px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-ink-faint"
              >
                <IconLock className="h-3 w-3" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 border-t border-line-soft pt-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-3xl text-ink">
              FORM<span className="text-clay">É</span>
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.14em] text-ink-soft">Imagine it. Wear it.</p>
            <p className="mt-1 font-display italic text-ink-faint">"Give your imagination form."</p>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Explore</p>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li><Link to="/create" className="hover:text-ink">Start Creating</Link></li>
              <li><Link to="/marketplace" className="hover:text-ink">Marketplace</Link></li>
              <li><Link to="/profile" className="hover:text-ink">My Creations</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Studio</p>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li><Link to="/about" className="hover:text-ink">About FORMÉ</Link></li>
              <li><Link to="/create" className="hover:text-ink">Materials Guide</Link></li>
              <li><Link to="/marketplace" className="hover:text-ink">Creator Rewards</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Categories</p>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li>T-Shirts</li>
              <li>Hoodies</li>
              <li>Caps</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line-soft pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>FORMÉ is currently a prototype. Your feedback helps shape what comes next.</p>
          <p>© {new Date().getFullYear()} FORMÉ — a design experiment.</p>
        </div>
      </div>
    </footer>
  );
}
