import type { DiagramComment, ProcessModel, ProcessNode, SourceRef, UploadedSourceFile } from "../types";
import { generateMermaid } from "../lib/mermaid";
import { makeId, nodeRefId } from "../lib/id";

function src(partial: Omit<SourceRef, "id" | "demo">): SourceRef {
  return { ...partial, id: makeId("dsrc"), demo: true };
}

const refundPolicy = (locator: string, excerpt: string, confidence: SourceRef["confidence"] = "High") =>
  src({ type: "document", title: "Refund Policy.pdf", locator, excerpt, confidence });

const supportSop = (locator: string, excerpt: string) =>
  src({ type: "document", title: "Customer Support SOP.docx", locator, excerpt, confidence: "High" });

const supportEmail = (excerpt: string) =>
  src({ type: "email", title: "Customer Support Email", locator: "Aug 12, 2026", excerpt, confidence: "Medium" });

const slackThread = (excerpt: string) =>
  src({ type: "slack", title: "Refund Handling Slack Thread", locator: "#customer-ops · Aug 12, 2026", excerpt, confidence: "Medium" });

const walkthroughVideo = (locator: string, excerpt: string) =>
  src({ type: "video", title: "Refund Walkthrough.mp4", locator, excerpt, confidence: "Medium" });

function node(
  id: string,
  type: ProcessNode["type"],
  label: string,
  opts: { actor?: string; description?: string; sources?: SourceRef[]; comments?: ProcessNode["comments"] } = {},
): ProcessNode {
  return {
    id,
    type,
    label,
    actor: opts.actor,
    description: opts.description,
    sources: opts.sources ?? [],
    comments: opts.comments ?? [],
    aiGenerated: true,
  };
}

const idStart = "demo_start";
const idReceive = "demo_receive";
const idValidate = "demo_validate";
const idDecision = "demo_decision";
const idReject = "demo_reject";
const idNotifyReject = "demo_notify_reject";
const idFinance = "demo_finance";
const idProcessRefund = "demo_process_refund";
const idNotifySuccess = "demo_notify_success";
const idEnd = "demo_end";

export function buildDemoModel(): ProcessModel {
  const validateComment = {
    id: makeId("c"),
    author: "Sarah Kim",
    text: "Should we also validate the customer's account status here, not just the order?",
    createdAt: Date.UTC(2026, 7, 13, 15, 20),
    resolved: false,
    replies: [
      {
        id: makeId("cr"),
        author: "You",
        text: "Yes, good catch — add an account-status check to this step.",
        createdAt: Date.UTC(2026, 7, 13, 16, 5),
      },
    ],
  };

  const nodes: ProcessNode[] = [
    node(idStart, "start", "Customer Submits Request", {
      description: "The customer initiates a refund request through the support portal or by contacting Customer Support directly.",
    }),
    node(idReceive, "process", "Receive Refund Request", {
      actor: "Customer Support",
      description: "Customer Support logs the incoming request and confirms receipt with the customer.",
      sources: [supportSop("Page 5", "Customer support receives and logs incoming refund requests within one business day of submission.")],
    }),
    node(idValidate, "process", "Validate Order", {
      actor: "Customer Support",
      description: "Verify the order against refund eligibility rules before proceeding.",
      sources: [
        refundPolicy("Page 3", "Refund requests must be validated against the original order before any further action is taken."),
        slackThread("\"We should always cross-check the order ID against the order management system before touching eligibility.\" — Priya, Support Lead"),
      ],
      comments: [validateComment],
    }),
    node(idDecision, "decision", "Is the request eligible?", {
      description: "Eligibility is determined by the refund window, item condition, and order status.",
      sources: [refundPolicy("Page 2", "Refunds are eligible within 30 days of delivery for unopened or defective items.")],
    }),
    node(idReject, "process", "Reject Request", {
      actor: "Customer Support",
      description: "Customer Support records the rejection reason for the customer's records.",
      sources: [refundPolicy("Page 2", "Requests outside the eligibility window must be rejected with a documented reason.")],
    }),
    node(idNotifyReject, "process", "Notify Customer", {
      actor: "Customer Support",
      description: "The customer is notified of the rejection along with the reason.",
      sources: [supportSop("Page 6", "Customers must be notified of a rejected refund within 24 hours, including the reason for rejection.")],
    }),
    node(idFinance, "process", "Finance Approval", {
      actor: "Finance",
      description: "Finance reviews eligible requests and approves the refund amount.",
      sources: [supportEmail("\"Finance must sign off on any refund over $50 before it is processed.\" — Finance Ops, Aug 12")],
    }),
    node(idProcessRefund, "process", "Process Refund", {
      actor: "Payment System",
      description: "The approved refund is issued back to the customer's original payment method.",
      sources: [walkthroughVideo("04:32", "\"...once Finance approves, the payment system automatically issues the refund to the original payment method within 3-5 business days...\"")],
    }),
    node(idNotifySuccess, "process", "Notify Customer", {
      actor: "Customer Support",
      description: "The customer is notified that the refund has been processed successfully.",
      sources: [supportSop("Page 6", "Customers must be notified once a refund has been successfully processed.")],
    }),
    node(idEnd, "end", "Request Closed", {
      description: "The refund request is closed and archived for reporting.",
    }),
  ];

  const edges = [
    { id: makeId("e"), from: idStart, to: idReceive },
    { id: makeId("e"), from: idReceive, to: idValidate },
    { id: makeId("e"), from: idValidate, to: idDecision },
    { id: makeId("e"), from: idDecision, to: idReject, label: "No" },
    { id: makeId("e"), from: idReject, to: idNotifyReject },
    { id: makeId("e"), from: idNotifyReject, to: idEnd },
    { id: makeId("e"), from: idDecision, to: idFinance, label: "Yes" },
    { id: makeId("e"), from: idFinance, to: idProcessRefund },
    { id: makeId("e"), from: idProcessRefund, to: idNotifySuccess },
    { id: makeId("e"), from: idNotifySuccess, to: idEnd },
  ];

  return { nodes, edges };
}

export function buildDemoUploads(): UploadedSourceFile[] {
  const now = Date.now();
  return [
    { id: nodeRefId(), kind: "document", name: "Refund Policy.pdf", fileType: "pdf", status: "ready", simulated: true, addedAt: now - 50000 },
    { id: nodeRefId(), kind: "document", name: "Customer Support SOP.docx", fileType: "docx", status: "ready", simulated: true, addedAt: now - 40000 },
    { id: nodeRefId(), kind: "video", name: "Refund Walkthrough.mp4", fileType: "mp4", duration: "04:32", status: "ready", simulated: true, addedAt: now - 30000 },
  ];
}

export const DEMO_PROMPT =
  "Create a process diagram for handling a customer refund request. The request is received by customer support, validated against the order, approved by finance, processed through the payment system, and the customer is notified. If the request is rejected, notify the customer with the reason.";

export function buildDemoComments(): DiagramComment[] {
  return [
    {
      id: makeId("dc"),
      author: "Marcus Webb",
      text: "Overall this matches what we walked through with Finance last week. Nice work.",
      createdAt: Date.UTC(2026, 7, 12, 10, 0),
      resolved: false,
      replies: [],
    },
  ];
}

export const DEMO_DOCUMENTATION = `# Customer Refund Process

## Purpose
This document describes how customer refund requests are received, validated, approved, and processed, ensuring customers are notified of the outcome in every case.

## Scope
This process begins when a customer submits a refund request and ends once the request is closed — whether the refund was approved and processed, or rejected.

## Actors
- Customer
- Customer Support
- Finance
- Payment System

## Process Steps
1. **Receive Refund Request** — Customer Support (Sources: Customer Support SOP.docx, Page 5)
   Customer Support logs the incoming request and confirms receipt with the customer.
2. **Validate Order** — Customer Support (Sources: Refund Policy.pdf, Page 3; Refund Handling Slack Thread)
   Verify the order against refund eligibility rules before proceeding. Includes an account-status check per team discussion.
3. **Check Eligibility** — Customer Support (Sources: Refund Policy.pdf, Page 2)
   Refunds are eligible within 30 days of delivery for unopened or defective items.
4. **Finance Approval** — Finance (Sources: Customer Support Email, Aug 12, 2026)
   Finance reviews eligible requests and approves the refund amount for anything over $50.
5. **Process Refund** — Payment System (Sources: Refund Walkthrough.mp4, 04:32)
   The approved refund is issued back to the customer's original payment method within 3-5 business days.
6. **Notify Customer** — Customer Support (Sources: Customer Support SOP.docx, Page 6)
   The customer is notified of the outcome — approval and processing, or rejection with a reason.

## Decision Points
- **Is the request eligible?** Determined by the refund window, item condition, and order status.
  - Yes → Finance Approval
  - No → Reject Request → Notify Customer

## Exceptions
- Order cannot be found or does not match the request.
- Finance rejects the refund request.
- Payment processing fails after approval (owner: Payment System — escalate to Finance).

## Inputs
- Customer refund request (portal or direct contact)
- Original order record
- Refund policy eligibility rules

## Outputs
- Approved refund issued to the customer
- Rejection notice with documented reason
- Closed request record for reporting

## Process Diagram
See the Diagram and Mermaid views for the interactive version of this process.
`;

export function demoMermaid(): string {
  return generateMermaid(buildDemoModel());
}
