import { IconInfo } from "./icons";

/**
 * Shown at every entry point into the Create flow (canvas pick, upload,
 * prompt, and the studio itself) so it's unmissable regardless of which
 * path someone takes in: this is a prototype, and nothing typed, drawn, or
 * uploaded here results in a real, physical garment.
 */
export default function PrototypeNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border border-[#d4af70]/40 bg-[#d4af70]/[0.08] px-4 py-3 text-left text-[12.5px] leading-relaxed text-[#17151a]/75 ${className}`}
    >
      <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-[#351c45]" />
      <p>
        <span className="font-medium text-[#351c45]">Prototype:</span> nothing you upload, describe, or draw here is
        turned into a real, physical product. No T-shirts are manufactured or shipped — this is a demo of the design
        experience only.
      </p>
    </div>
  );
}
