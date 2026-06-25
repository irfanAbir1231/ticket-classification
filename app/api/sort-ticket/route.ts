import { NextRequest, NextResponse } from "next/server";

import { classifyTicket } from "@/lib/classifier";
import type {
  SortTicketRequest,
  SortTicketResponse,
  ValidationError,
} from "@/types";

// ---------------------------------------------------------------------------
// Safety filter
// Patterns that indicate the summary may be instructing someone to share
// sensitive credentials or account data with a third party.
// ---------------------------------------------------------------------------
const UNSAFE_SUMMARY_PATTERNS: RegExp[] = [
  // Direct imperatives — "share/send/provide/give/enter your PIN/OTP/…"
  /\b(share|send|provide|give|enter|disclose|reveal|submit)\b.{0,40}\b(pin|otp|password|passcode|full card number|card number)\b/i,
  // Reversed order — "PIN … share/send"
  /\b(pin|otp|password|passcode|full card number|card number)\b.{0,40}\b(share|send|provide|give|enter|disclose|reveal|submit)\b/i,
  // Imperative phrasing targeting the agent summary reader
  /do not share your\b/i,
  /never share your\b/i,
  // Generic "please share" with any sensitive word anywhere
  /please (share|send|provide|give).{0,60}\b(pin|otp|password|card)\b/i,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  body: Record<string, unknown>,
  field: "ticket_id" | "message",
  errors: ValidationError[],
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({
      field,
      message: `${field} is required and must be a string.`,
    });
    return "";
  }

  return value.trim();
}

function optionalString(
  body: Record<string, unknown>,
  field: "channel" | "locale",
  errors: ValidationError[],
): string | undefined {
  const value = body[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push({
      field,
      message: `${field} must be a string when provided.`,
    });
    return undefined;
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

  const ticket_id = requiredString(body, "ticket_id", errors);
  const message = requiredString(body, "message", errors);
  const channel = optionalString(body, "channel", errors);
  const locale = optionalString(body, "locale", errors);

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: { ticket_id, message, channel, locale },
    errors: [],
  };
}

/**
 * Sanitizes `agent_summary` so it never contains language that could be read
 * as instructing an agent or customer to share sensitive credentials.
 *
 * The safety message is the canonical replacement defined in the sprint plan.
 */
function sanitizeAgentSummary(summary: string): string {
  const isSafe = !UNSAFE_SUMMARY_PATTERNS.some((re) => re.test(summary));

  if (isSafe) {
    return summary;
  }

  return "Customer reports a sensitive account or payment issue. Do not request PINs, OTPs, passwords, or full card numbers from the customer.";
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: [{ field: "body", message: "Invalid JSON body." }] },
      { status: 400 },
    );
  }

  // 2. Validate fields
  const { data, errors } = validateBody(body);

  if (!data) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  return NextResponse.json({
    ticket: await classifyTicket(data),
  });
}
