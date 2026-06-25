import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ticket-classification",
    timestamp: new Date().toISOString(),
  });
}
