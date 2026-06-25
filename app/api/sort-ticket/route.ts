import { NextRequest, NextResponse } from "next/server";

import { classifyTicket } from "@/lib/classifier";
import type { SortTicketRequest, ValidationError } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  const title = body.title;
  const description = body.description;
  const customerEmail = body.customerEmail;

  if (title !== undefined && typeof title !== "string") {
    errors.push({ field: "title", message: "Title must be a string." });
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    errors.push({
      field: "description",
      message: "Description is required and must be a non-empty string.",
    });
  }

  if (customerEmail !== undefined && typeof customerEmail !== "string") {
    errors.push({
      field: "customerEmail",
      message: "Customer email must be a string.",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      title: typeof title === "string" ? title.trim() : undefined,
      description: (description as string).trim(),
      customerEmail:
        typeof customerEmail === "string" ? customerEmail.trim() : undefined,
    },
    errors,
  };
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

  return NextResponse.json({
    ticket: classifyTicket(data),
  });
}
