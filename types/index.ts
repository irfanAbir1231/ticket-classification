export enum CaseType {
  WrongTransfer = "wrong_transfer",
  PaymentFailed = "payment_failed",
  RefundRequest = "refund_request",
  PhishingOrSocialEngineering = "phishing_or_social_engineering",
  Other = "other",
}

export enum Severity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export enum Department {
  CustomerSupport = "customer_support",
  DisputeResolution = "dispute_resolution",
  PaymentsOps = "payments_ops",
  FraudRisk = "fraud_risk",
}

export interface SortTicketRequest {
  ticket_id: string;
  channel?: string;
  locale?: string;
  message: string;
}

export interface TicketClassification {
  case_type: CaseType;
  severity: Severity;
  department: Department;
  agent_summary: string;
  human_review_required: boolean;
  confidence: number;
}

export interface SortTicketResponse extends TicketClassification {
  ticket_id: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
