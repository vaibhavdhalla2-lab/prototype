import type {
  ModificationPreview,
  PlanDecision,
  PlanStep,
  ProcessEdge,
  ProcessModel,
  ProcessNode,
  ProcessPlan,
  SourceRef,
  UploadedSourceFile,
} from "../types";
import { makeId, nodeRefId } from "./id";

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

interface DomainDecisionSpec {
  question: string;
  afterStepIndex: number;
  yesLabel: string;
  noLabel: string;
  onNo: { stepName: string; actor: string } | "end";
}

interface DomainTemplate {
  key: string;
  keywords: string[];
  processTitle: string;
  understanding: string;
  actors: string[];
  steps: { name: string; actor: string }[];
  decisions: DomainDecisionSpec[];
  exceptions: string[];
  gaps: string[];
  enhanced: string;
}

const DOMAINS: DomainTemplate[] = [
  {
    key: "refund",
    keywords: ["refund", "reimburse", "chargeback"],
    processTitle: "Customer Refund Process",
    understanding:
      "I understand this as a customer refund workflow involving Customer Support, Finance and the Payment System. The process begins when a customer submits a request and ends once the customer has been notified of the outcome.",
    actors: ["Customer", "Customer Support", "Finance", "Payment System"],
    steps: [
      { name: "Receive Refund Request", actor: "Customer Support" },
      { name: "Validate Order", actor: "Customer Support" },
      { name: "Check Eligibility", actor: "Customer Support" },
      { name: "Finance Approval", actor: "Finance" },
      { name: "Process Refund", actor: "Payment System" },
      { name: "Notify Customer", actor: "Customer Support" },
    ],
    decisions: [
      {
        question: "Is the request eligible?",
        afterStepIndex: 2,
        yesLabel: "Yes",
        noLabel: "No",
        onNo: { stepName: "Notify Customer of Rejection", actor: "Customer Support" },
      },
      {
        question: "Is the refund approved?",
        afterStepIndex: 3,
        yesLabel: "Approved",
        noLabel: "Rejected",
        onNo: { stepName: "Notify Customer of Rejection", actor: "Customer Support" },
      },
    ],
    exceptions: [
      "Order cannot be found in the system.",
      "Finance rejects the refund request.",
      "Payment processing fails after approval.",
    ],
    gaps: ["The provided information does not specify what should happen if payment processing fails."],
    enhanced:
      "Create a customer refund process beginning with request submission, followed by order validation, eligibility verification, finance approval, payment processing and customer notification. Include rejection and payment-failure paths, and clarify which team owns communicating the outcome to the customer.",
  },
  {
    key: "onboarding",
    keywords: ["onboarding", "onboard", "new hire", "new employee"],
    processTitle: "Employee Onboarding Process",
    understanding:
      "I understand this as an employee onboarding workflow involving HR, IT, the Hiring Manager and the New Hire. The process begins when an offer is accepted and ends once the employee is fully set up and productive.",
    actors: ["New Hire", "HR", "IT", "Hiring Manager"],
    steps: [
      { name: "Receive Signed Offer", actor: "HR" },
      { name: "Create Employee Record", actor: "HR" },
      { name: "Provision Accounts & Equipment", actor: "IT" },
      { name: "Background Check", actor: "HR" },
      { name: "Schedule Orientation", actor: "HR" },
      { name: "Assign Onboarding Buddy", actor: "Hiring Manager" },
      { name: "Complete First Week Check-in", actor: "Hiring Manager" },
    ],
    decisions: [
      {
        question: "Does the background check pass?",
        afterStepIndex: 3,
        yesLabel: "Pass",
        noLabel: "Fail",
        onNo: { stepName: "Rescind Offer & Notify Candidate", actor: "HR" },
      },
    ],
    exceptions: ["Equipment is not available before the start date.", "Background check is delayed."],
    gaps: ["The provided information does not specify a remote-employee equipment shipping process."],
    enhanced:
      "Create an employee onboarding process beginning with a signed offer, followed by employee record creation, IT provisioning, a background check, orientation scheduling and a first-week check-in. Include a path for a failed background check and clarify remote vs on-site handling.",
  },
  {
    key: "expense",
    keywords: ["expense", "reimbursement", "expense report"],
    processTitle: "Employee Expense Approval Process",
    understanding:
      "I understand this as an expense approval workflow involving the Employee, their Manager, and Finance. The process begins when an expense report is submitted and ends once the employee is reimbursed.",
    actors: ["Employee", "Manager", "Finance"],
    steps: [
      { name: "Submit Expense Report", actor: "Employee" },
      { name: "Validate Receipts", actor: "Finance" },
      { name: "Manager Review", actor: "Manager" },
      { name: "Finance Approval", actor: "Finance" },
      { name: "Process Reimbursement", actor: "Finance" },
      { name: "Notify Employee", actor: "Finance" },
    ],
    decisions: [
      {
        question: "Are the receipts valid and within policy?",
        afterStepIndex: 1,
        yesLabel: "Valid",
        noLabel: "Invalid",
        onNo: { stepName: "Return to Employee for Correction", actor: "Finance" },
      },
      {
        question: "Is the expense approved?",
        afterStepIndex: 3,
        yesLabel: "Approved",
        noLabel: "Denied",
        onNo: { stepName: "Notify Employee of Denial", actor: "Manager" },
      },
    ],
    exceptions: ["Receipt is missing or illegible.", "Expense exceeds policy limits."],
    gaps: ["The provided information does not specify an escalation path for expenses above a certain threshold."],
    enhanced:
      "Create an employee expense approval process beginning with report submission, followed by receipt validation, manager review, finance approval and reimbursement. Include paths for invalid receipts and denied expenses, and clarify approval thresholds.",
  },
  {
    key: "incident",
    keywords: ["incident", "outage", "on-call", "postmortem"],
    processTitle: "Incident Management Process",
    understanding:
      "I understand this as an incident management workflow involving the On-call Engineer, the Incident Commander, and Engineering. The process begins when an alert fires and ends once the incident is resolved and reviewed.",
    actors: ["On-call Engineer", "Incident Commander", "Engineering", "Customers"],
    steps: [
      { name: "Detect Incident", actor: "On-call Engineer" },
      { name: "Triage Severity", actor: "On-call Engineer" },
      { name: "Declare Incident & Assign Commander", actor: "Incident Commander" },
      { name: "Mitigate Impact", actor: "Engineering" },
      { name: "Resolve Incident", actor: "Engineering" },
      { name: "Conduct Postmortem", actor: "Incident Commander" },
    ],
    decisions: [
      {
        question: "Is this a customer-facing severity 1 incident?",
        afterStepIndex: 1,
        yesLabel: "Sev1",
        noLabel: "Lower severity",
        onNo: { stepName: "Log & Monitor", actor: "On-call Engineer" },
      },
    ],
    exceptions: ["Mitigation attempt fails and must be retried.", "Incident reopens after resolution."],
    gaps: ["The provided information does not specify customer communication timing during an active incident."],
    enhanced:
      "Create an incident management process beginning with detection and triage, followed by severity classification, commander assignment, mitigation, resolution and a postmortem. Include a lower-severity logging path and clarify customer communication timing.",
  },
  {
    key: "deployment",
    keywords: ["deployment", "deploy", "release", "software deployment", "ci/cd"],
    processTitle: "Software Deployment Process",
    understanding:
      "I understand this as a software deployment workflow involving the Developer, the Reviewer, and the Release Manager. The process begins when a change is ready for release and ends once it is live in production and verified.",
    actors: ["Developer", "Reviewer", "Release Manager", "QA"],
    steps: [
      { name: "Open Pull Request", actor: "Developer" },
      { name: "Run Automated Tests", actor: "QA" },
      { name: "Code Review", actor: "Reviewer" },
      { name: "Merge to Main", actor: "Developer" },
      { name: "Deploy to Staging", actor: "Release Manager" },
      { name: "Deploy to Production", actor: "Release Manager" },
      { name: "Verify Release", actor: "QA" },
    ],
    decisions: [
      {
        question: "Do automated tests pass?",
        afterStepIndex: 1,
        yesLabel: "Pass",
        noLabel: "Fail",
        onNo: { stepName: "Fix & Resubmit", actor: "Developer" },
      },
      {
        question: "Does staging verification succeed?",
        afterStepIndex: 4,
        yesLabel: "Success",
        noLabel: "Failure",
        onNo: { stepName: "Roll Back & Investigate", actor: "Release Manager" },
      },
    ],
    exceptions: ["Production deploy fails and must be rolled back.", "Staging environment is unavailable."],
    gaps: ["The provided information does not specify an approval gate for production deploys outside business hours."],
    enhanced:
      "Create a software deployment process beginning with a pull request, followed by automated testing, code review, merging, staging deployment, production deployment and release verification. Include failure and rollback paths at each verification gate.",
  },
];

export function detectDomain(text: string): DomainTemplate | null {
  const lower = text.toLowerCase();
  for (const d of DOMAINS) {
    if (d.keywords.some((k) => lower.includes(k))) return d;
  }
  return null;
}

export function enhancePrompt(original: string): string {
  const domain = detectDomain(original);
  if (domain) return domain.enhanced;
  const trimmed = original.trim().replace(/\.$/, "");
  if (!trimmed) {
    return "Describe the process, including who is involved, the sequence of steps, key decisions, and how exceptions should be handled.";
  }
  const subject = trimmed[0].toUpperCase() + trimmed.slice(1);
  return `${subject}. Structure the process with a clear starting trigger, the actors involved at each step, the sequence of activities, any approval or verification decisions, the expected inputs and outputs, and explicit handling for exceptions or rejected cases. Conclude with how the outcome is communicated to the requester.`;
}

function genericPlanFromPrompt(promptText: string): DomainTemplate {
  const clauses = promptText
    .split(/(?:,|\.|;| then | followed by | after that | next,?)/i)
    .map((c) => c.trim())
    .filter((c) => c.split(/\s+/).length >= 2)
    .slice(0, 6);

  const base = clauses.length >= 2 ? clauses : ["Receive request", "Review details", "Approve or reject request", "Complete and notify requester"];

  const steps = base.map((c, i) => ({
    name: titleCase(c.replace(/^(create|build|design|make)\s+/i, "").slice(0, 60)),
    actor: i % 3 === 0 ? "Process Owner" : i % 3 === 1 ? "Reviewer" : "System",
  }));

  const subjectWords = promptText.split(/\s+/).slice(0, 6).join(" ") || "this process";

  return {
    key: "generic",
    keywords: [],
    processTitle: titleCase(subjectWords.replace(/[^a-zA-Z0-9 ]/g, "")) || "Custom Process",
    understanding: `I understand this as a workflow describing "${subjectWords.trim()}...". It involves ${steps.length} main activities carried out in sequence, with at least one review or approval decision.`,
    actors: Array.from(new Set(steps.map((s) => s.actor))),
    steps,
    decisions: [
      {
        question: "Does the request meet the requirements to proceed?",
        afterStepIndex: Math.max(1, Math.floor(steps.length / 2)),
        yesLabel: "Yes",
        noLabel: "No",
        onNo: { stepName: "Notify Requester of Rejection", actor: "Process Owner" },
      },
    ],
    exceptions: ["Required information is missing from the request."],
    gaps: ["The provided information does not fully specify every exception path — review and refine the generated plan."],
    enhanced: "",
  };
}

export function generatePlan(promptText: string): ProcessPlan {
  const domain = detectDomain(promptText) ?? genericPlanFromPrompt(promptText);
  const steps: PlanStep[] = domain.steps.map((s) => ({ id: makeId("step"), name: s.name, actor: s.actor }));
  const decisions: PlanDecision[] = domain.decisions
    .filter((d) => d.afterStepIndex < steps.length)
    .map((d) => ({
      id: makeId("dec"),
      question: d.question,
      afterStepId: steps[d.afterStepIndex].id,
      yesLabel: d.yesLabel,
      noLabel: d.noLabel,
      onNo: d.onNo,
    }));
  return {
    processTitle: domain.processTitle,
    understanding: domain.understanding,
    steps,
    actors: domain.actors,
    decisions,
    exceptions: domain.exceptions,
    gaps: domain.gaps,
  };
}

function makeNode(
  type: ProcessNode["type"],
  label: string,
  actor?: string,
  description?: string,
): ProcessNode {
  return {
    id: nodeRefId(),
    type,
    label,
    actor,
    description,
    sources: [],
    comments: [],
    aiGenerated: true,
  };
}

function makeEdge(from: string, to: string, label?: string): ProcessEdge {
  return { id: makeId("e"), from, to, label };
}

const SOURCE_POOL_DESCRIPTIONS = [
  "describes the expected handling for this step",
  "confirms who owns this activity",
  "outlines the criteria used at this stage",
  "documents the standard procedure for this step",
];

function attachSimulatedSources(nodes: ProcessNode[], uploads: UploadedSourceFile[]): void {
  const ready = uploads.filter((u) => u.status === "ready");
  if (ready.length === 0) return;
  let idx = 0;
  nodes.forEach((n, i) => {
    if (n.type === "start" || n.type === "end") return;
    if (i % 2 === 1) return;
    const file = ready[idx % ready.length];
    idx++;
    const source: SourceRef =
      file.kind === "video"
        ? {
            id: makeId("src"),
            type: "video",
            title: file.name,
            locator: `${Math.floor(Math.random() * 4)}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}`,
            excerpt: `Video walkthrough ${SOURCE_POOL_DESCRIPTIONS[i % SOURCE_POOL_DESCRIPTIONS.length]}: "${n.label}".`,
            confidence: "Medium",
          }
        : {
            id: makeId("src"),
            type: "document",
            title: file.name,
            locator: `Page ${1 + (i % 6)}`,
            excerpt: `This document ${SOURCE_POOL_DESCRIPTIONS[i % SOURCE_POOL_DESCRIPTIONS.length]}: "${n.label}".`,
            confidence: "High",
          };
    n.sources.push(source);
  });
}

export function buildModelFromPlan(plan: ProcessPlan, uploads: UploadedSourceFile[] = []): ProcessModel {
  const nodes: ProcessNode[] = [];
  const edges: ProcessEdge[] = [];

  const startNode = makeNode("start", "Start");
  nodes.push(startNode);
  let prevId = startNode.id;
  let pendingLabel: string | undefined;

  for (const step of plan.steps) {
    const stepNode = makeNode("process", step.name, step.actor);
    nodes.push(stepNode);
    edges.push(makeEdge(prevId, stepNode.id, pendingLabel));
    pendingLabel = undefined;
    prevId = stepNode.id;

    for (const dec of plan.decisions.filter((d) => d.afterStepId === step.id)) {
      const decNode = makeNode("decision", dec.question);
      nodes.push(decNode);
      edges.push(makeEdge(prevId, decNode.id));

      if (dec.onNo === "end") {
        const endNode = makeNode("end", "End");
        nodes.push(endNode);
        edges.push(makeEdge(decNode.id, endNode.id, dec.noLabel));
      } else {
        const noStepNode = makeNode("process", dec.onNo.stepName, dec.onNo.actor);
        nodes.push(noStepNode);
        edges.push(makeEdge(decNode.id, noStepNode.id, dec.noLabel));
        const noEndNode = makeNode("end", "End");
        nodes.push(noEndNode);
        edges.push(makeEdge(noStepNode.id, noEndNode.id));
      }

      prevId = decNode.id;
      pendingLabel = dec.yesLabel;
    }
  }

  const finalEnd = makeNode("end", "End");
  nodes.push(finalEnd);
  edges.push(makeEdge(prevId, finalEnd.id, pendingLabel));

  attachSimulatedSources(nodes, uploads);

  return { nodes, edges };
}

// ---------- Component-level AI modification ----------

function findQuoted(text: string): string | null {
  const m = text.match(/"([^"]+)"|'([^']+)'/);
  if (!m) return null;
  return m[1] ?? m[2];
}

function cloneModel(model: ProcessModel): ProcessModel {
  return {
    nodes: model.nodes.map((n) => ({ ...n, sources: [...n.sources], comments: [...n.comments] })),
    edges: model.edges.map((e) => ({ ...e })),
  };
}

export function interpretModification(
  targetNode: ProcessNode,
  instruction: string,
  model: ProcessModel,
): ModificationPreview {
  const lower = instruction.toLowerCase();
  const result = cloneModel(model);
  const idx = result.nodes.findIndex((n) => n.id === targetNode.id);
  const current = result.nodes[idx];

  const base: ModificationPreview = {
    instruction,
    targetNodeId: targetNode.id,
    summary: "",
    removedNodeIds: [],
    addedNodes: [],
    modifiedNodes: [],
    edgesBefore: model.edges.filter((e) => e.from === targetNode.id || e.to === targetNode.id),
    edgesAfter: [],
    resultModel: result,
  };

  // --- Split ---
  if (/\bsplit\b/.test(lower)) {
    let partA = "Part 1";
    let partB = "Part 2";
    const intoMatch = instruction.match(/into\s+(.+)/i);
    if (intoMatch) {
      const parts = intoMatch[1]
        .split(/,|\band\b/i)
        .map((p) => p.trim().replace(/[.!?]+$/, ""))
        .filter(Boolean);
      if (parts.length >= 2) {
        partA = titleCase(parts[0]);
        partB = titleCase(parts[1]);
      }
    } else {
      partA = `${current.label} (Part 1)`;
      partB = `${current.label} (Part 2)`;
    }

    const nodeA: ProcessNode = { ...makeNode("process", partA, current.actor), sources: [...current.sources] };
    const nodeB: ProcessNode = { ...makeNode("process", partB, current.actor) };

    const incoming = result.edges.filter((e) => e.to === current.id);
    const outgoing = result.edges.filter((e) => e.from === current.id);

    result.nodes.splice(idx, 1, nodeA, nodeB);
    result.edges = result.edges.filter((e) => e.from !== current.id && e.to !== current.id);
    for (const e of incoming) result.edges.push(makeEdge(e.from, nodeA.id, e.label));
    result.edges.push(makeEdge(nodeA.id, nodeB.id));
    for (const e of outgoing) result.edges.push(makeEdge(nodeB.id, e.to, e.label));

    base.removedNodeIds = [current.id];
    base.addedNodes = [nodeA, nodeB];
    base.summary = `Split "${current.label}" into "${partA}" and "${partB}".`;
    base.edgesAfter = result.edges.filter((e) => e.from === nodeA.id || e.to === nodeA.id || e.from === nodeB.id || e.to === nodeB.id);
    return base;
  }

  // --- Delete / remove ---
  if (/\b(delete|remove)\s+(this|step|it)?\b/.test(lower) && current.type !== "start" && current.type !== "end") {
    const incoming = result.edges.filter((e) => e.to === current.id);
    const outgoing = result.edges.filter((e) => e.from === current.id);
    result.nodes.splice(idx, 1);
    result.edges = result.edges.filter((e) => e.from !== current.id && e.to !== current.id);
    for (const inE of incoming) {
      for (const outE of outgoing) {
        result.edges.push(makeEdge(inE.from, outE.to, inE.label ?? outE.label));
      }
    }
    base.removedNodeIds = [current.id];
    base.summary = `Removed "${current.label}" and reconnected the surrounding steps.`;
    return base;
  }

  // --- Rename ---
  if (/\brename\b|call it|renamed to/.test(lower)) {
    const quoted = findQuoted(instruction);
    const afterTo = instruction.match(/to\s+(.+)$/i);
    const newLabel = quoted ?? (afterTo ? titleCase(afterTo[1].replace(/["'.]/g, "")) : current.label);
    const before = { ...current };
    current.label = newLabel;
    current.aiGenerated = true;
    base.modifiedNodes = [{ before, after: { ...current } }];
    base.summary = `Renamed "${before.label}" to "${newLabel}".`;
    return base;
  }

  // --- Change actor ---
  if (/\bactor\b|assign(ed)?\s+to|\bowner\b/.test(lower)) {
    const quoted = findQuoted(instruction);
    const afterTo = instruction.match(/to\s+([A-Za-z][A-Za-z\s]*)$/i);
    const newActor = quoted ?? (afterTo ? titleCase(afterTo[1].trim()) : current.actor ?? "Process Owner");
    const before = { ...current };
    current.actor = newActor;
    current.aiGenerated = true;
    base.modifiedNodes = [{ before, after: { ...current } }];
    base.summary = `Changed the actor for "${current.label}" to ${newActor}.`;
    return base;
  }

  // --- Simplify ---
  if (/\bsimplify\b|shorter|less detail/.test(lower)) {
    const before = { ...current };
    current.description = `${current.label} is performed with minimal handoffs.`;
    current.aiGenerated = true;
    base.modifiedNodes = [{ before, after: { ...current } }];
    base.summary = `Simplified the description for "${current.label}".`;
    return base;
  }

  // --- More detail ---
  if (/more detail|detailed|expand/.test(lower)) {
    const before = { ...current };
    current.description = `${current.description ? current.description + " " : ""}This step includes validation of inputs, confirmation with the responsible actor, and a recorded outcome before moving to the next step.`;
    current.aiGenerated = true;
    base.modifiedNodes = [{ before, after: { ...current } }];
    base.summary = `Added more detail to "${current.label}".`;
    return base;
  }

  // --- Add validation / step before ---
  if (/add.*(validation|step).*before|insert.*before/.test(lower)) {
    const label = findQuoted(instruction) ?? "Validate Input";
    const newNode = makeNode("process", titleCase(label), current.actor);
    const incoming = result.edges.filter((e) => e.to === current.id);
    result.edges = result.edges.filter((e) => e.to !== current.id);
    for (const e of incoming) result.edges.push(makeEdge(e.from, newNode.id, e.label));
    result.edges.push(makeEdge(newNode.id, current.id));
    result.nodes.splice(idx, 0, newNode);
    base.addedNodes = [newNode];
    base.summary = `Added "${newNode.label}" before "${current.label}".`;
    base.edgesAfter = result.edges.filter((e) => e.from === newNode.id || e.to === newNode.id);
    return base;
  }

  // --- Add exception ---
  if (/add.*exception|error path|failure path|add.*when/.test(lower)) {
    const whenMatch = instruction.match(/when\s+(.+)$/i);
    const label = whenMatch ? titleCase(whenMatch[1].replace(/[."']/g, "")) : "Handle Exception";
    const exceptionNode = makeNode("process", label, current.actor);
    const endNode = makeNode("end", "End");
    result.nodes.push(exceptionNode, endNode);
    result.edges.push(makeEdge(current.id, exceptionNode.id, "Exception"));
    result.edges.push(makeEdge(exceptionNode.id, endNode.id));
    base.addedNodes = [exceptionNode, endNode];
    base.summary = `Added an exception path "${label}" from "${current.label}".`;
    base.edgesAfter = [makeEdge(current.id, exceptionNode.id, "Exception")];
    return base;
  }

  // --- Fallback generic tweak ---
  const before = { ...current };
  current.description = `${current.description ? current.description + " " : ""}Updated per request: "${instruction}".`;
  current.aiGenerated = true;
  base.modifiedNodes = [{ before, after: { ...current } }];
  base.summary = `Applied your instruction to "${current.label}".`;
  return base;
}

// ---------- Documentation generation ----------

export function generateDocumentation(model: ProcessModel, title: string): string {
  const start = model.nodes.find((n) => n.type === "start");
  const ends = model.nodes.filter((n) => n.type === "end");
  const steps = model.nodes.filter((n) => n.type !== "start" && n.type !== "end");
  const decisions = model.nodes.filter((n) => n.type === "decision");
  const actors = Array.from(new Set(model.nodes.map((n) => n.actor).filter(Boolean))) as string[];
  const inputs = model.nodes.filter((n) => n.type === "io" && (model.edges.some((e) => e.to === n.id) === false));
  const outputs = model.nodes.filter((n) => n.type === "io" && model.edges.every((e) => e.from !== n.id));

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push(
    `This document describes the ${title.toLowerCase()}, covering each step, the actors responsible, and the decisions and exceptions that shape the outcome.`,
  );
  lines.push("");
  lines.push("## Scope");
  lines.push(
    `This process begins with "${start?.label ?? "the initial trigger"}" and concludes at ${ends.map((e) => `"${e.label}"`).join(" or ") || "completion"}.`,
  );
  lines.push("");
  lines.push("## Actors");
  for (const a of actors) lines.push(`- ${a}`);
  lines.push("");
  lines.push("## Process Steps");
  steps.forEach((s, i) => {
    lines.push(`${i + 1}. **${s.label}**${s.actor ? ` — ${s.actor}` : ""}`);
    if (s.description) lines.push(`   ${s.description}`);
    else lines.push(`   ${s.type === "decision" ? "Decision point in the process." : `${s.label} is carried out as part of the process.`}`);
    if (s.sources.length) {
      lines.push(`   Sources: ${s.sources.map((src) => `${src.title} (${src.locator})`).join("; ")}`);
    }
  });
  lines.push("");
  lines.push("## Decision Points");
  if (decisions.length === 0) lines.push("No explicit decision points were identified.");
  for (const d of decisions) {
    const out = model.edges.filter((e) => e.from === d.id);
    lines.push(`- **${d.label}**`);
    for (const o of out) {
      const target = model.nodes.find((n) => n.id === o.to);
      lines.push(`  - ${o.label ?? "Then"} → ${target?.label ?? "Unknown"}`);
    }
  }
  lines.push("");
  lines.push("## Exceptions");
  const exceptionNodes = model.nodes.filter((n) => model.edges.some((e) => e.to === n.id && /exception|reject|fail|error/i.test(e.label ?? "") && e.from !== undefined));
  if (exceptionNodes.length === 0) {
    lines.push("No explicit exception paths are defined in the current diagram.");
  } else {
    for (const n of exceptionNodes) lines.push(`- ${n.label}`);
  }
  lines.push("");
  lines.push("## Inputs");
  if (inputs.length === 0) lines.push("No standalone input components are defined.");
  for (const n of inputs) lines.push(`- ${n.label}`);
  lines.push("");
  lines.push("## Outputs");
  if (outputs.length === 0) lines.push("No standalone output components are defined.");
  for (const n of outputs) lines.push(`- ${n.label}`);
  lines.push("");
  lines.push("## Process Diagram");
  lines.push("_See the attached diagram in the Diagram view / export._");
  lines.push("");

  return lines.join("\n");
}
