import { useApp } from "../lib/store";
import { useFlowActions } from "../lib/actions";
import { IconSparkle, IconUpload, IconBuild } from "./icons";

const EXAMPLES = ["Customer onboarding", "Employee expense approval", "Incident management", "Software deployment", "Customer refund"];

const EXAMPLE_TEXT: Record<string, string> = {
  "Customer onboarding":
    "Create a customer onboarding process starting with account creation, followed by identity verification, welcome setup, and first login confirmation.",
  "Employee expense approval":
    "Create an employee expense approval process from report submission through manager review, finance approval, and reimbursement.",
  "Incident management":
    "Create an incident management process starting with detection and triage, through mitigation, resolution, and a postmortem review.",
  "Software deployment":
    "Create a software deployment process from pull request through code review, staging deployment, production deployment, and release verification.",
  "Customer refund":
    "Create a process diagram for handling a customer refund request. The request is received by customer support, validated against the order, approved by finance, processed through the payment system, and the customer is notified. If the request is rejected, notify the customer with the reason.",
};

export default function EmptyState() {
  const { dispatch } = useApp();
  const actions = useFlowActions();

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
        <IconSparkle className="h-6 w-6" />
      </div>
      <h2 className="max-w-md text-xl font-semibold text-ink">Create your first process diagram</h2>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        Describe a workflow, upload a document, or provide a video and FlowBuilder AI will turn it into an interactive process diagram.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus()}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
        >
          <IconSparkle className="h-4 w-4" /> Start with a prompt
        </button>
        <button
          onClick={() => document.getElementById("doc-upload-input")?.click()}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-soft hover:bg-surface-2"
        >
          <IconUpload className="h-4 w-4" /> Upload files
        </button>
        <button
          onClick={actions.loadDemo}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-soft hover:bg-surface-2"
        >
          <IconBuild className="h-4 w-4" /> Load demo process
        </button>
      </div>
      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Example prompts</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => dispatch({ type: "SET_PROMPT", text: EXAMPLE_TEXT[ex] })}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-brand hover:text-brand-deep"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
