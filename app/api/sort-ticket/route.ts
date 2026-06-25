import { NextRequest, NextResponse } from "next/server";

import { classifyTicket } from "@/lib/classifier";
import type { SortTicketRequest, ValidationError } from "@/types";

const UNSAFE_SUMMARY_PATTERNS = [
  /share (your )?(pin|otp|password)/i,
  /send (your )?(pin|otp|password)/i,
  /provide (your )?(pin|otp|password)/i,
  /enter (your )?(pin|otp|password)/i,
  /full card number/i,
  /complete card number/i,
  /card number.*(share|send|provide|enter)/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(
  body: Record<string, unknown>,
  field: "channel" | "locale",
  errors: ValidationError[],
) {
  const value = body[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push({ field, message: `${field} must be a string when provided.` });
    return undefined;
  }

  return value.trim();
}

function requiredString(
  body: Record<string, unknown>,
  field: "ticket_id" | "message",
  errors: ValidationError[],
) {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({ field, message: `${field} is required and must be a string.` });
    return "";
  }

  return value.trim();
}

function validateBody(body: unknown): {
  data?: SortTicketRequest;
  errors: ValidationError[];
} {
  if (!isRecord(body)) {
    return {
      errors: [{ field: "body", message: "Request body must be a JSON object." }],
    };
  }

  const errors: ValidationError[] = [];
  const ticketId = requiredString(body, "ticket_id", errors);
  const message = requiredString(body, "message", errors);
  const channel = optionalString(body, "channel", errors);
  const locale = optionalString(body, "locale", errors);

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      ticket_id: ticketId,
      channel,
      locale,
      message,
    },
    errors,
  };
}

function sanitizeAgentSummary(summary: string) {
  const containsUnsafeRequest = UNSAFE_SUMMARY_PATTERNS.some((pattern) =>
    pattern.test(summary),
  );

  if (!containsUnsafeRequest) {
    return summary;
  }

  return "Customer reports a sensitive account or payment issue. Do not request PINs, OTPs, passwords, or full card numbers from the customer.";
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: [{ field: "body", message: "Invalid JSON body." }] },
      { status: 400 },
    );
  }

  const { data, errors } = validateBody(body);

  if (!data) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const classification = classifyTicket(data.message);

  return NextResponse.json({
    ticket_id: data.ticket_id,
    ...classification,
    agent_summary: sanitizeAgentSummary(classification.agent_summary),
  });
}
