import type { DiagramComment, ProcessModel, ProcessNode, SourceRef, UploadedSourceFile } from "../types";
import { generateMermaid } from "../lib/mermaid";
import { makeId, nodeRefId } from "../lib/id";

function src(partial: Omit<SourceRef, "id" | "demo">): SourceRef {
  return { ...partial, id: makeId("dsrc"), demo: true };
}

const sopDoc = (locator: string, excerpt: string, confidence: SourceRef["confidence"] = "High") =>
  src({ type: "document", title: "Order-to-Cash SOP.pdf", locator, excerpt, confidence });

const financePolicy = (locator: string, excerpt: string) =>
  src({ type: "document", title: "Credit & Collections Policy.docx", locator, excerpt, confidence: "High" });

const opsEmail = (excerpt: string) => src({ type: "email", title: "Sales Ops Email", locator: "Aug 14, 2026", excerpt, confidence: "Medium" });

const slackThread = (excerpt: string) =>
  src({ type: "slack", title: "Order Desk Slack Thread", locator: "#order-desk · Aug 14, 2026", excerpt, confidence: "Medium" });

const walkthroughVideo = (locator: string, excerpt: string) =>
  src({ type: "video", title: "O2C Walkthrough.mp4", locator, excerpt, confidence: "Medium" });

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

export function buildDemoModel(): ProcessModel {
  const creditComment = {
    id: makeId("c"),
    author: "Priya Shah",
    text: "Should the Credit Manager also be notified by email, or is the in-app queue enough?",
    createdAt: Date.UTC(2026, 7, 14, 11, 10),
    resolved: false,
    replies: [
      { id: makeId("cr"), author: "You", text: "In-app queue is enough for now — email can be a fast-follow.", createdAt: Date.UTC(2026, 7, 14, 13, 40) },
    ],
  };

  const n: ProcessNode[] = [
    node("order_received", "start", "Customer Submits Order", { description: "The customer places an order through the storefront or a Sales representative." }),
    node("create_order", "process", "Create Order in CRM", {
      actor: "Sales",
      description: "Sales creates the order record in the CRM with customer, product and pricing details.",
      sources: [sopDoc("Page 2", "Every order must be logged in the CRM before it proceeds to validation.")],
    }),
    node("validate_order", "process", "Validate Order", {
      actor: "Sales Operations",
      description: "Validate mandatory fields, pricing and contract terms against the CRM record.",
      sources: [
        sopDoc("Page 4", "Order validation must confirm mandatory fields, pricing accuracy and contract terms before credit review."),
        slackThread('"We keep seeing orders missing the contract reference — flag those before they reach credit." — Order Desk Lead'),
      ],
    }),
    node("order_complete", "decision", "Order Complete?", { description: "Checks whether all mandatory fields, pricing and contract terms are present." }),
    node("correct_resubmit", "process", "Correct & Resubmit", { actor: "Sales", description: "Sales corrects the missing or incorrect fields and resubmits for validation." }),
    node("credit_check", "process", "Credit Check", {
      actor: "Finance",
      description: "Finance runs a credit check against the customer's credit standing and open balance.",
      sources: [financePolicy("Page 1", "All new orders above the customer's approved credit limit require a credit check before an SAP order is created.")],
    }),
    node("credit_decision", "decision", "Credit Approved?", { comments: [creditComment] }),
    node("credit_manager_review", "process", "Credit Manager Review", {
      actor: "Credit Manager",
      description: "The Credit Manager reviews the flagged order and decides how to proceed.",
      sources: [opsEmail('"Anything over the limit comes to me directly — I can approve, ask for security, or reject." — Credit Manager')],
    }),
    node("credit_manager_decision", "decision", "Manager Decision"),
    node("request_security", "process", "Request Security Deposit", { actor: "Finance", description: "Finance requests a deposit or security to offset the credit risk." }),
    node("order_rejected", "end", "Order Rejected"),
    node("sap_order", "process", "Create SAP Sales Order", {
      actor: "Sales Operations",
      description: "System: SAP. The approved order is created as a sales order in SAP.",
      sources: [walkthroughVideo("02:10", '"...once credit clears, the order flows into SAP automatically as a sales order..."')],
    }),
    node("inventory_check", "process", "Inventory Check", { actor: "Warehouse", description: "Warehouse confirms stock availability for every line item." }),
    node("finance_validation", "process", "Finance Validation", { actor: "Finance", description: "Finance validates pricing, tax and billing details in parallel with the inventory check." }),
    node("fulfilment", "process", "Prepare Shipment", { actor: "Warehouse", description: "Warehouse picks, packs and stages the order once both inventory and finance checks clear." }),
    node("delivery_attempt", "process", "Delivery Attempt", { actor: "Warehouse", description: "The carrier attempts delivery to the customer's address." }),
    node("delivered", "decision", "Delivered?"),
    node("retries_exhausted", "decision", "Retried Twice Already?"),
    node("retry_delivery", "process", "Retry Delivery", { actor: "Warehouse", description: "A second delivery attempt is scheduled with the carrier." }),
    node("escalate_csm", "process", "Escalate to Customer Service Manager", {
      actor: "Customer Service Manager",
      description: "After two failed attempts, the Customer Service Manager contacts the customer to arrange delivery.",
    }),
    node("invoice", "process", "Generate Invoice", { actor: "Finance", description: "Finance generates the invoice from the fulfilled order." }),
    node("invoice_correct", "decision", "Invoice Correct?"),
    node("correct_invoice", "process", "Correct Invoice", { actor: "Finance", description: "Finance corrects pricing or line-item errors on the invoice." }),
    node("send_invoice", "process", "Send Invoice to Customer", {
      actor: "Finance",
      sources: [sopDoc("Page 9", "Invoices must be sent to the customer within one business day of fulfilment.")],
    }),
    node("monitor_receivable", "process", "Monitor Receivable", { actor: "Collections", description: "Collections tracks the invoice against its due date." }),
    node("payment_received", "decision", "Payment Received?"),
    node("grace_period", "process", "Grace Period", { actor: "Collections", description: "A short grace period is applied before follow-up begins." }),
    node("still_unpaid", "decision", "Still Unpaid After Grace Period?"),
    node("collections_followup", "process", "Collections Follow-up", {
      actor: "Collections",
      sources: [financePolicy("Page 6", "Accounts unpaid after the grace period move to active collections follow-up.")],
    }),
    node("resolved_after_followup", "decision", "Resolved?"),
    node("finance_manager_escalation", "process", "Finance Manager Escalation", {
      actor: "Finance Manager",
      description: "Unresolved accounts are escalated for a payment plan or write-off decision.",
    }),
    node("close_order", "end", "Order Closed"),
  ];

  const e = (from: string, to: string, label?: string) => ({ id: makeId("e"), from, to, label });

  const edges = [
    e("order_received", "create_order"),
    e("create_order", "validate_order"),
    e("validate_order", "order_complete"),
    e("order_complete", "correct_resubmit", "No"),
    e("correct_resubmit", "validate_order"),
    e("order_complete", "credit_check", "Yes"),
    e("credit_check", "credit_decision"),
    e("credit_decision", "sap_order", "Approved"),
    e("credit_decision", "credit_manager_review", "Flagged"),
    e("credit_manager_review", "credit_manager_decision"),
    e("credit_manager_decision", "sap_order", "Approve"),
    e("credit_manager_decision", "request_security", "Request Security"),
    e("credit_manager_decision", "order_rejected", "Reject"),
    e("request_security", "sap_order"),
    e("sap_order", "inventory_check"),
    e("sap_order", "finance_validation"),
    e("inventory_check", "fulfilment"),
    e("finance_validation", "fulfilment"),
    e("fulfilment", "delivery_attempt"),
    e("delivery_attempt", "delivered"),
    e("delivered", "invoice", "Yes"),
    e("delivered", "retries_exhausted", "No"),
    e("retries_exhausted", "retry_delivery", "No"),
    e("retry_delivery", "delivery_attempt"),
    e("retries_exhausted", "escalate_csm", "Yes"),
    e("escalate_csm", "invoice"),
    e("invoice", "invoice_correct"),
    e("invoice_correct", "correct_invoice", "No"),
    e("correct_invoice", "invoice"),
    e("invoice_correct", "send_invoice", "Yes"),
    e("send_invoice", "monitor_receivable"),
    e("monitor_receivable", "payment_received"),
    e("payment_received", "close_order", "Yes"),
    e("payment_received", "grace_period", "No"),
    e("grace_period", "still_unpaid"),
    e("still_unpaid", "close_order", "No"),
    e("still_unpaid", "collections_followup", "Yes"),
    e("collections_followup", "resolved_after_followup"),
    e("resolved_after_followup", "close_order", "Yes"),
    e("resolved_after_followup", "finance_manager_escalation", "No"),
    e("finance_manager_escalation", "close_order"),
  ];

  return { nodes: n, edges };
}

export function buildDemoUploads(): UploadedSourceFile[] {
  const now = Date.now();
  return [
    { id: nodeRefId(), kind: "document", name: "Order-to-Cash SOP.pdf", fileType: "pdf", status: "ready", simulated: true, addedAt: now - 50000 },
    { id: nodeRefId(), kind: "document", name: "Credit & Collections Policy.docx", fileType: "docx", status: "ready", simulated: true, addedAt: now - 40000 },
    { id: nodeRefId(), kind: "video", name: "O2C Walkthrough.mp4", fileType: "mp4", duration: "02:10", status: "ready", simulated: true, addedAt: now - 30000 },
  ];
}

export const DEMO_PROMPT =
  "Create an end-to-end Order-to-Cash process covering CRM, SAP, Finance, Warehouse and Collections. Start with order creation and validation, run a credit check with a Credit Manager escalation path, create the SAP order, run parallel inventory and finance checks, fulfil with delivery retries and a Customer Service Manager escalation, invoice with a correction loop, and finish with receivables monitoring and a collections/Finance Manager escalation path.";

export function buildDemoComments(): DiagramComment[] {
  return [
    {
      id: makeId("dc"),
      author: "Marcus Webb",
      text: "This matches the walkthrough we did with Finance and Warehouse last week — nice work capturing both escalation paths.",
      createdAt: Date.UTC(2026, 7, 13, 9, 30),
      resolved: false,
      replies: [],
    },
  ];
}

export const DEMO_DOCUMENTATION = `# Order-to-Cash Process

## Purpose
This document describes the end-to-end Order-to-Cash process across Sales, CRM, SAP, Warehouse, Finance and Collections, from order creation through cash receipt.

## Scope
This process begins when a customer submits an order and ends once the order is closed — whether payment was collected on time or after a collections escalation.

## Actors
- Customer
- Sales
- Sales Operations
- Finance
- Credit Manager
- Warehouse
- Customer Service Manager
- Collections
- Finance Manager

## Process Steps
1. **Create Order in CRM** — Sales
   Sales creates the order record in the CRM with customer, product and pricing details.
2. **Validate Order** — Sales Operations (Sources: Order-to-Cash SOP.pdf, Page 4)
   Validate mandatory fields, pricing and contract terms. Incomplete orders loop back through **Correct & Resubmit**.
3. **Credit Check** — Finance (Sources: Credit & Collections Policy.docx, Page 1)
   Orders above the customer's credit limit are flagged for **Credit Manager Review**, which can approve, request a security deposit, or reject the order.
4. **Create SAP Sales Order** — Sales Operations (System: SAP)
   The approved order is created as a sales order in SAP.
5. **Inventory Check** and **Finance Validation** — Warehouse / Finance (parallel)
   Both must complete before fulfilment begins.
6. **Fulfilment** — Warehouse
   Delivery is attempted up to twice before escalating to the Customer Service Manager.
7. **Invoicing** — Finance
   Invoice errors loop back through **Correct Invoice** before the invoice is sent.
8. **AR & Collections** — Collections / Finance Manager
   Unpaid receivables move through a grace period, collections follow-up, and a Finance Manager escalation for a payment plan.

## Decision Points
- **Order Complete?** — No loops back to correction; Yes proceeds to credit check.
- **Credit Approved?** — Approved orders proceed directly; flagged orders go to Credit Manager Review.
- **Manager Decision** — Approve, Request Security, or Reject.
- **Delivered?** / **Retried Twice Already?** — Governs the delivery retry and CSM escalation path.
- **Invoice Correct?** — No loops back to correction.
- **Payment Received?** / **Still Unpaid After Grace Period?** / **Resolved?** — Governs the collections escalation path.

## Exceptions
- Order fails validation and is returned to Sales for correction.
- Customer fails the credit check and is routed to the Credit Manager.
- Delivery fails twice and is escalated to the Customer Service Manager.
- Invoice contains errors and is corrected before sending.
- Payment is not received after the grace period and is escalated to Collections, then to the Finance Manager.

## Inputs
- Customer order (storefront or Sales)
- CRM order record
- Customer credit standing

## Outputs
- Fulfilled shipment
- Sent invoice
- Closed order record with payment collected or a resolved payment plan

## Process Diagram
See the Diagram and Mermaid views for the interactive version of this process.
`;

export function demoMermaid(): string {
  return generateMermaid(buildDemoModel());
}
