export enum TicketCategory {
  Account = "account",
  Billing = "billing",
  General = "general",
  Technical = "technical",
}

export enum TicketPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

export interface SortTicketRequest {
  title?: string;
  description: string;
  customerEmail?: string;
}

export interface SortedTicket {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasons: string[];
  routedTo: string;
}

export interface SortTicketResponse {
  ticket: SortedTicket;
}

export interface ValidationError {
  field: string;
  message: string;
}
