# Person 2 Implementation Plan: Middleware and Validation

## Role

Own the `POST /api/sort-ticket` route, request validation, response formatting,
shared API types, and safety filtering.

## Owned Files

- `app/api/sort-ticket/route.ts`
- `types/index.ts`
- `README.md` request and response schema section

## Goals

- Accept only valid ticket classification requests.
- Call Person 3's classifier through a clean interface.
- Return the exact response shape required by the sprint plan.
- Enforce the strict safety rule before sending `agent_summary`.

## Request Schema

`POST /api/sort-ticket` accepts:

```json
{
  "ticket_id": "TICKET-123",
  "channel": "web",
  "locale": "en",
  "message": "Payment failed but I was charged twice."
}
```

Required:

- `ticket_id`: non-empty string
- `message`: non-empty string

Optional:

- `channel`: string
- `locale`: string

Invalid requests should return HTTP `400`:

```json
{
  "errors": [
    {
      "field": "message",
      "message": "message is required and must be a string."
    }
  ]
}
```

## Response Schema

Successful responses must contain:

```json
{
  "ticket_id": "TICKET-123",
  "case_type": "payment_failed",
  "severity": "high",
  "department": "payments_ops",
  "agent_summary": "Customer reports a payment failed issue. Current severity is high.",
  "human_review_required": false,
  "confidence": 0.63
}
```

Do not wrap the response inside a `ticket` object. The grader expects these
fields at the top level.

## Shared Types

`types/index.ts` should define:

- `CaseType`
- `Severity`
- `Department`
- `SortTicketRequest`
- `TicketClassification`
- `SortTicketResponse`
- `ValidationError`

Allowed `case_type` values:

- `wrong_transfer`
- `payment_failed`
- `refund_request`
- `phishing_or_social_engineering`
- `other`

Allowed `severity` values:

- `low`
- `medium`
- `high`
- `critical`

Allowed `department` values:

- `customer_support`
- `dispute_resolution`
- `payments_ops`
- `fraud_risk`

## Safety Rule

Before returning the response, scan `agent_summary`.

The response must never ask the customer to share:

- PIN
- OTP
- password
- full card number

If the summary contains unsafe wording, sanitize it before returning:

```text
Customer reports a sensitive account or payment issue. Do not request PINs, OTPs, passwords, or full card numbers from the customer.
```

## Implementation Checklist

- Parse JSON with `await request.json()`.
- Return HTTP `400` for invalid JSON.
- Validate `ticket_id` and `message`.
- Validate optional `channel` and `locale` if present.
- Call `classifyTicket(data.message)` from `@/lib/classifier`.
- Echo `ticket_id` in the response.
- Run safety filtering against `agent_summary`.
- Return a JSON response with the exact top-level schema.

## Manual Test Cases

Valid request:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-001","message":"Payment failed but I was charged twice."}'
```

Missing `message`:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-002"}'
```

Phishing or social engineering:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-003","message":"Someone asked me to share my OTP and password."}'
```

## Acceptance Criteria

- Invalid JSON returns HTTP `400`.
- Missing `ticket_id` or `message` returns HTTP `400`.
- Valid requests return the required top-level JSON response.
- `confidence` is a number between `0` and `1`.
- Unsafe summary text is sanitized before response.
- `npm run lint` passes.
- `npx tsc --noEmit` passes.

## Handoff Notes

Person 3 owns classification behavior. This route should treat the classifier as
a dependency and protect the HTTP contract around it.
