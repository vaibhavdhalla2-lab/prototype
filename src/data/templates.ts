import type { ProcessModel, ProcessNode, TemplateDefinition } from "../types";

function node(id: string, type: ProcessNode["type"], label: string, actor?: string, description?: string): ProcessNode {
  return { id, type, label, actor, description, sources: [], comments: [], aiGenerated: false };
}

function edge(from: string, to: string, label?: string) {
  return { id: `${from}__${to}`, from, to, label };
}

function basicProcessFlow(): ProcessModel {
  return {
    nodes: [
      node("bp_start", "start", "Start"),
      node("bp_receive", "process", "Receive Request", "Process Owner"),
      node("bp_validate", "process", "Validate Request", "Process Owner"),
      node("bp_decision", "decision", "Valid?"),
      node("bp_process", "process", "Process", "Process Owner"),
      node("bp_reject", "process", "Reject", "Process Owner"),
      node("bp_end", "end", "End"),
    ],
    edges: [
      edge("bp_start", "bp_receive"),
      edge("bp_receive", "bp_validate"),
      edge("bp_validate", "bp_decision"),
      edge("bp_decision", "bp_process", "Yes"),
      edge("bp_decision", "bp_reject", "No"),
      edge("bp_process", "bp_end"),
      edge("bp_reject", "bp_end"),
    ],
  };
}

function approvalWorkflow(): ProcessModel {
  return {
    nodes: [
      node("aw_submit", "start", "Request Submitted", "Requester"),
      node("aw_review", "process", "Manager Review", "Manager"),
      node("aw_decision", "decision", "Approved?"),
      node("aw_finance", "process", "Finance Approval", "Finance"),
      node("aw_return", "process", "Return to Requester", "Manager"),
      node("aw_completed", "end", "Completed"),
      node("aw_closed", "end", "Closed"),
    ],
    edges: [
      edge("aw_submit", "aw_review"),
      edge("aw_review", "aw_decision"),
      edge("aw_decision", "aw_finance", "Yes"),
      edge("aw_decision", "aw_return", "No"),
      edge("aw_finance", "aw_completed"),
      edge("aw_return", "aw_closed"),
    ],
  };
}

function complaintResolution(): ProcessModel {
  return {
    nodes: [
      node("cr_received", "start", "Complaint Received", "Customer"),
      node("cr_log", "process", "Log & Categorize", "Customer Support"),
      node("cr_severity", "decision", "Severity Check"),
      node("cr_escalate1", "process", "Escalate", "Customer Service Manager"),
      node("cr_assign", "process", "Assign Agent", "Customer Support"),
      node("cr_investigate", "process", "Investigate", "Customer Support"),
      node("cr_resolved", "decision", "Resolved?"),
      node("cr_notify", "process", "Notify Customer", "Customer Support"),
      node("cr_escalate2", "process", "Escalate to Manager", "Customer Service Manager"),
      node("cr_close", "end", "Close"),
    ],
    edges: [
      edge("cr_received", "cr_log"),
      edge("cr_log", "cr_severity"),
      edge("cr_severity", "cr_escalate1", "Critical"),
      edge("cr_severity", "cr_assign", "Normal"),
      edge("cr_escalate1", "cr_investigate"),
      edge("cr_assign", "cr_investigate"),
      edge("cr_investigate", "cr_resolved"),
      edge("cr_resolved", "cr_notify", "Yes"),
      edge("cr_resolved", "cr_escalate2", "No"),
      edge("cr_notify", "cr_close"),
      edge("cr_escalate2", "cr_close"),
    ],
  };
}

function orderToCash(): ProcessModel {
  return {
    nodes: [
      node("o2c_order", "start", "Customer Order", "Customer"),
      node("o2c_validate", "process", "Order Validation", "Sales", "Validate mandatory fields, pricing and contract terms."),
      node("o2c_credit", "process", "Credit Check", "Finance", "Verify the customer's credit standing before order confirmation."),
      node("o2c_decision", "decision", "Credit Approved?"),
      node("o2c_creditmgr", "process", "Credit Manager Review", "Finance"),
      node("o2c_sap", "process", "Create SAP Order", "Sales", "System: SAP"),
      node("o2c_inventory", "process", "Inventory Check", "Warehouse"),
      node("o2c_fulfil", "process", "Fulfilment", "Warehouse"),
      node("o2c_invoice", "process", "Invoice", "Finance"),
      node("o2c_payment", "process", "Payment", "Finance"),
      node("o2c_ar", "end", "AR Closure"),
    ],
    edges: [
      edge("o2c_order", "o2c_validate"),
      edge("o2c_validate", "o2c_credit"),
      edge("o2c_credit", "o2c_decision"),
      edge("o2c_decision", "o2c_sap", "Yes"),
      edge("o2c_decision", "o2c_creditmgr", "No"),
      edge("o2c_sap", "o2c_inventory"),
      edge("o2c_inventory", "o2c_fulfil"),
      edge("o2c_fulfil", "o2c_invoice"),
      edge("o2c_invoice", "o2c_payment"),
      edge("o2c_payment", "o2c_ar"),
    ],
  };
}

function incidentManagement(): ProcessModel {
  return {
    nodes: [
      node("im_reported", "start", "Incident Reported"),
      node("im_ticket", "process", "Create Ticket", "On-call Engineer"),
      node("im_categorize", "process", "Categorize", "On-call Engineer"),
      node("im_assess", "process", "Assess Severity", "On-call Engineer"),
      node("im_critical", "decision", "Critical?"),
      node("im_escalate", "process", "Escalate", "Incident Commander"),
      node("im_assign", "process", "Assign Team", "Engineering"),
      node("im_investigate", "process", "Investigation", "Engineering"),
      node("im_resolution", "process", "Resolution", "Engineering"),
      node("im_closed", "end", "Closed"),
    ],
    edges: [
      edge("im_reported", "im_ticket"),
      edge("im_ticket", "im_categorize"),
      edge("im_categorize", "im_assess"),
      edge("im_assess", "im_critical"),
      edge("im_critical", "im_escalate", "Yes"),
      edge("im_critical", "im_assign", "No"),
      edge("im_escalate", "im_investigate"),
      edge("im_assign", "im_investigate"),
      edge("im_investigate", "im_resolution"),
      edge("im_resolution", "im_closed"),
    ],
  };
}

function employeeOnboarding(): ProcessModel {
  return {
    nodes: [
      node("eo_offer", "start", "Offer Accepted"),
      node("eo_hr", "process", "HR Documentation", "HR"),
      node("eo_it", "process", "IT Provisioning", "IT"),
      node("eo_manager", "process", "Manager Preparation", "Hiring Manager"),
      node("eo_day1", "process", "Day 1", "HR"),
      node("eo_training", "process", "Training", "HR"),
      node("eo_review", "end", "30-Day Review"),
    ],
    edges: [
      edge("eo_offer", "eo_hr"),
      edge("eo_hr", "eo_it"),
      edge("eo_it", "eo_manager"),
      edge("eo_manager", "eo_day1"),
      edge("eo_day1", "eo_training"),
      edge("eo_training", "eo_review"),
    ],
  };
}

function systemArchitecture(): ProcessModel {
  return {
    nodes: [
      node("sa_user", "start", "User"),
      node("sa_frontend", "process", "Frontend"),
      node("sa_gateway", "process", "API Gateway"),
      node("sa_service", "process", "Application Service"),
      node("sa_auth", "io", "Auth"),
      node("sa_db", "io", "Database"),
      node("sa_queue", "io", "Queue"),
      node("sa_worker", "process", "Worker"),
      node("sa_response", "end", "Response Returned"),
    ],
    edges: [
      edge("sa_user", "sa_frontend"),
      edge("sa_frontend", "sa_gateway"),
      edge("sa_gateway", "sa_service"),
      edge("sa_service", "sa_auth"),
      edge("sa_service", "sa_db"),
      edge("sa_service", "sa_queue"),
      edge("sa_queue", "sa_worker"),
      edge("sa_auth", "sa_response"),
      edge("sa_db", "sa_response"),
      edge("sa_worker", "sa_response"),
    ],
  };
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "basic-process-flow",
    name: "Basic Process Flow",
    category: "General",
    description: "A simple request → validate → decide → process/reject flow.",
    prompt: "Create a basic process flow: receive a request, validate it, then either process it or reject it based on validity.",
    model: basicProcessFlow(),
  },
  {
    id: "approval-workflow",
    name: "Approval Workflow",
    category: "Operations",
    description: "Manager and finance approval with a return-to-requester path.",
    prompt: "Create an approval workflow: a request is submitted, reviewed by a manager, and if approved goes to finance approval and completion; if not approved it returns to the requester.",
    model: approvalWorkflow(),
  },
  {
    id: "customer-complaint-resolution",
    name: "Customer Complaint Resolution",
    category: "Customer Support",
    description: "Severity-based routing with escalation and resolution confirmation.",
    prompt:
      "Create an end-to-end customer complaint resolution workflow involving Customer Support and a Customer Service Manager, with severity-based escalation and a resolution confirmation step.",
    model: complaintResolution(),
  },
  {
    id: "order-to-cash",
    name: "Order-to-Cash",
    category: "Finance & Sales",
    description: "Customer order through credit check, SAP order, fulfilment and AR closure.",
    prompt: "Create an Order-to-Cash workflow involving Sales, Finance, Warehouse and SAP, including a credit check with a Credit Manager review path.",
    model: orderToCash(),
  },
  {
    id: "incident-management",
    name: "Incident Management",
    category: "Engineering",
    description: "Detection, severity-based escalation, investigation and resolution.",
    prompt: "Create an incident management process starting with detection and triage, through severity-based escalation, investigation and resolution.",
    model: incidentManagement(),
  },
  {
    id: "employee-onboarding",
    name: "Employee Onboarding",
    category: "HR",
    description: "Linear onboarding process from offer acceptance to 30-day review.",
    prompt: "Create an employee onboarding process from offer acceptance through HR documentation, IT provisioning, manager preparation, day one, training and a 30-day review.",
    model: employeeOnboarding(),
  },
  {
    id: "system-architecture",
    name: "System Architecture",
    category: "Engineering",
    description: "Request flow from user through gateway, service and backing systems.",
    prompt: "Create a system architecture diagram: a user calls the frontend, which goes through an API gateway to an application service that talks to Auth, a Database and a Queue, with the queue feeding a worker.",
    model: systemArchitecture(),
  },
];
