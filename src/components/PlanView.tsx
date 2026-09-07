import { useState } from "react";
import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { makeId } from "../lib/id";
import type { PlanDecision, PlanStep } from "../types";
import { IconX, IconPlus, IconTrash, IconSparkle } from "./icons";

export default function PlanView() {
  const { state } = useApp();
  const actions = useFlowActions();
  const [newException, setNewException] = useState("");

  if (!state.showPlanModal || !state.plan) return null;
  const plan = state.plan;

  function set<K extends keyof typeof plan>(key: K, value: (typeof plan)[K]) {
    actions.updatePlan({ ...plan, [key]: value });
  }

  function updateStep(id: string, patch: Partial<PlanStep>) {
    set(
      "steps",
      plan.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }
  function removeStep(id: string) {
    set(
      "steps",
      plan.steps.filter((s) => s.id !== id),
    );
    set(
      "decisions",
      plan.decisions.filter((d) => d.afterStepId !== id),
    );
  }
  function addStep() {
    const step: PlanStep = { id: makeId("step"), name: "New Step", actor: "Process Owner" };
    set("steps", [...plan.steps, step]);
  }
  function moveStep(id: string, dir: -1 | 1) {
    const idx = plan.steps.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (target < 0 || target >= plan.steps.length) return;
    const next = [...plan.steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    set("steps", next);
  }

  function updateDecision(id: string, patch: Partial<PlanDecision>) {
    set(
      "decisions",
      plan.decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  }
  function removeDecision(id: string) {
    set(
      "decisions",
      plan.decisions.filter((d) => d.id !== id),
    );
  }
  function addDecision() {
    const last = plan.steps[plan.steps.length - 1];
    if (!last) return;
    const decision: PlanDecision = {
      id: makeId("dec"),
      question: "Does this step meet the criteria?",
      afterStepId: last.id,
      yesLabel: "Yes",
      noLabel: "No",
      onNo: "end",
    };
    set("decisions", [...plan.decisions, decision]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">AI Plan</p>
            <h2 className="text-base font-semibold text-ink">{plan.processTitle}</h2>
          </div>
          <button onClick={actions.closePlanModal} className="grid h-8 w-8 place-items-center rounded-md text-ink-faint hover:bg-surface-2">
            <IconX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-5">
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Understanding</h3>
            <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-sm text-ink">{plan.understanding}</p>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Proposed Process</h3>
              <button onClick={addStep} className="flex items-center gap-1 text-xs font-medium text-brand-deep hover:text-brand">
                <IconPlus className="h-3.5 w-3.5" /> Add step
              </button>
            </div>
            <ol className="space-y-2">
              {plan.steps.map((step, i) => (
                <li key={step.id} className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-2.5 py-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">{i + 1}</span>
                  <input
                    value={step.name}
                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink hover:border-border focus:border-brand focus:bg-surface focus:outline-none"
                  />
                  <input
                    value={step.actor}
                    onChange={(e) => updateStep(step.id, { actor: e.target.value })}
                    placeholder="Actor"
                    className="w-32 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs text-ink-soft hover:border-border focus:border-brand focus:bg-surface focus:outline-none"
                  />
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => moveStep(step.id, -1)} disabled={i === 0} className="grid h-6 w-6 place-items-center rounded text-ink-faint hover:bg-surface disabled:opacity-30">
                      ↑
                    </button>
                    <button onClick={() => moveStep(step.id, 1)} disabled={i === plan.steps.length - 1} className="grid h-6 w-6 place-items-center rounded text-ink-faint hover:bg-surface disabled:opacity-30">
                      ↓
                    </button>
                    <button onClick={() => removeStep(step.id)} className="grid h-6 w-6 place-items-center rounded text-ink-faint hover:bg-danger-soft hover:text-danger">
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Actors</h3>
            <div className="flex flex-wrap gap-1.5">
              {plan.actors.map((a) => (
                <span key={a} className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-ink-soft">
                  {a}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Decisions</h3>
              <button onClick={addDecision} className="flex items-center gap-1 text-xs font-medium text-brand-deep hover:text-brand">
                <IconPlus className="h-3.5 w-3.5" /> Add decision
              </button>
            </div>
            <ul className="space-y-1.5">
              {plan.decisions.map((d) => (
                <li key={d.id} className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-2.5 py-2">
                  <span className="text-ink-faint">◆</span>
                  <input
                    value={d.question}
                    onChange={(e) => updateDecision(d.id, { question: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink hover:border-border focus:border-brand focus:bg-surface focus:outline-none"
                  />
                  <button onClick={() => removeDecision(d.id)} className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-faint hover:bg-danger-soft hover:text-danger">
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {plan.decisions.length === 0 && <p className="text-xs text-ink-faint">No decision points yet — add one above.</p>}
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Exceptions</h3>
            <ul className="mb-2 space-y-1">
              {plan.exceptions.map((ex, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2.5 py-1.5 text-xs text-ink-soft">
                  {ex}
                  <button
                    onClick={() =>
                      set(
                        "exceptions",
                        plan.exceptions.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-ink-faint hover:text-danger"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-1.5">
              <input
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                placeholder="Add an exception path…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand"
              />
              <button
                onClick={() => {
                  if (!newException.trim()) return;
                  set("exceptions", [...plan.exceptions, newException.trim()]);
                  setNewException("");
                }}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2"
              >
                Add
              </button>
            </div>
          </section>

          {plan.gaps.length > 0 && (
            <section className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2.5">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-warn">Potential Gaps</h3>
              <ul className="space-y-1 text-sm text-ink">
                {plan.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <button
            onClick={actions.reviseWithAi}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-2"
          >
            <IconSparkle className="h-3.5 w-3.5" /> Ask AI to Revise
          </button>
          <div className="flex gap-2">
            <button onClick={actions.closePlanModal} className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-faint hover:text-ink">
              Cancel
            </button>
            <button
              onClick={() => actions.handleApprovePlan(plan)}
              className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-deep"
            >
              Approve Plan &amp; Build Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
