import { TEMPLATES } from "../../data/templates";
import type { TemplateDefinition } from "../../types";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { IconX } from "../icons";
import TemplatePreview from "./TemplatePreview";

export default function TemplateGallery({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (template: TemplateDefinition) => void;
}) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-fade-up"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-ink">Block Diagram Templates</h2>
            <p className="text-xs text-ink-faint">Start from a proven process shape, then refine it with AI.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-ink-faint hover:bg-surface-2">
            <IconX />
          </button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto scrollbar-none p-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border-soft bg-surface-2 text-left transition hover:border-brand hover:bg-surface"
            >
              <div className="h-28 border-b border-border-soft bg-canvas p-2">
                <TemplatePreview model={t.model} />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="w-fit rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-deep">
                  {t.category}
                </span>
                <h3 className="text-sm font-semibold text-ink">{t.name}</h3>
                <p className="text-xs leading-snug text-ink-faint">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
