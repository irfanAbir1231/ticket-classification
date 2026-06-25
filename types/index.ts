export type CaseType =
  | "wrong_transfer"
  | "payment_failed"
  | "refund_request"
  | "phishing_or_social_engineering"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type Department =
  | "customer_support"
  | "dispute_resolution"
  | "payments_ops"
  | "fraud_risk";

export interface SortTicketRequest {
  ticket_id: string;
  channel?: string;
  locale?: string;
  message: string;
}

export interface SortedTicket {
  case_type: CaseType;
  severity: Severity;
  department: Department;
  agent_summary: string;
  human_review_required: boolean;
}

export interface SortTicketResponse extends TicketClassification {
  ticket_id: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

