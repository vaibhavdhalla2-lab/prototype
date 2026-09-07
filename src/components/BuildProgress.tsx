import { useApp } from "../lib/store";
import { IconCheck } from "./icons";

export default function BuildProgress() {
  const { state } = useApp();
  if (!state.building) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl animate-fade-up">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-deep">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-deep border-t-transparent" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Building your process diagram…</p>
            <p className="text-xs text-ink-faint">This usually takes a few seconds.</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {state.buildStages.map((s) => (
            <li key={s.key} className="flex items-center gap-2.5 text-sm">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  s.status === "done"
                    ? "border-success bg-success text-white"
                    : s.status === "active"
                      ? "border-brand text-brand"
                      : "border-border text-transparent"
                }`}
              >
                {s.status === "done" ? (
                  <IconCheck className="h-3 w-3" />
                ) : s.status === "active" ? (
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                )}
              </span>
              <span className={s.status === "pending" ? "text-ink-faint" : "text-ink"}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
