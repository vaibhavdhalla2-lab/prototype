import { useApp } from "../lib/store";
import { IconCheck, IconAlert, IconX } from "./icons";

export default function Toasts() {
  const { state, dispatch } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg animate-fade-up ${
            t.tone === "error" ? "border-danger/30 bg-surface text-danger" : "border-border bg-surface-2 text-ink"
          }`}
        >
          {t.tone === "error" ? <IconAlert className="h-4 w-4 shrink-0" /> : <IconCheck className="h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => dispatch({ type: "REMOVE_TOAST", id: t.id })} className="ml-1 opacity-60 hover:opacity-100">
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
