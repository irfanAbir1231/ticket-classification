# Implementation Plan

This file turns the sprint plan into concrete implementation work for the
Next.js API service.

## Goal

Build a small customer support ticket classification API with:

- `GET /api/health` for service readiness.
- `POST /api/sort-ticket` for request validation, classification, response
  formatting, and safety filtering.
- A standalone classifier module that can be upgraded from regex logic to an
  LLM later without changing the API route contract.

## File Ownership

| Person | Area | Files |
| --- | --- | --- |
| Person 1 | Infrastructure and ops | `app/api/health/route.ts`, `.env.local`, `.gitignore`, deployment docs |
| Person 2 | Middleware and validation | `app/api/sort-ticket/route.ts`, `types/index.ts` |
| Person 3 | Classification engine | `lib/classifier.ts` |
| Shared | Documentation and integration | `README.md`, `IMPLEMENTATION.md` |

## Request Schema

`POST /api/sort-ticket` accepts JSON with:

```json
{
  "ticket_id": "TICKET-123",
  "channel": "mobile_app",
  "locale": "en",
  "message": "I sent money to the wrong recipient and need help."
}
```

Required fields:

- `ticket_id`: non-empty string.
- `message`: non-empty string.

Optional fields:

- `channel`: string.
- `locale`: string.

Invalid requests return HTTP `400` with an `errors` array.

## Response Schema

Successful responses return:

```json
{
  "ticket_id": "TICKET-123",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "Customer reports a wrong transfer issue: I sent money to the wrong recipient and need help. Current severity is high.",
  "human_review_required": false,
  "confidence": 0.63
}
```

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

## Classification Logic

`lib/classifier.ts` exports:

```ts
classifyTicket(message: string)
```

The current implementation is rule based:

- Social engineering, OTP, PIN, password, scam, and phishing language maps to
  `phishing_or_social_engineering`, `critical`, and `fraud_risk`.
- Wrong recipient or mistaken transfer language maps to `wrong_transfer` and
  `dispute_resolution`.
- Failed, declined, or incomplete payment language maps to `payment_failed` and
  `payments_ops`.
- Refund, duplicate charge, and money-back language maps to `refund_request` and
  `customer_support`.
- Unmatched messages fall back to `other`, `low`, and `customer_support`.

`human_review_required` is always `true` when severity is `critical` or case type
is `phishing_or_social_engineering`.

## Safety Rule

Before sending the response, `app/api/sort-ticket/route.ts` scans
`agent_summary`.

If the summary asks the customer to share, send, provide, or enter a PIN, OTP,
password, or full card number, the API replaces it with a safe neutral summary:

```text
Customer reports a sensitive account or payment issue. Do not request PINs, OTPs, passwords, or full card numbers from the customer.
```

This keeps the response compliant even if the classifier is later replaced with
an LLM.

## Local Runbook

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Classify a ticket:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-001","message":"Payment failed but I was charged twice."}'
```

## Deployment Notes

Vercel is the fastest deployment target for this Next.js App Router project.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Add required environment variables in the Vercel project settings.
4. Deploy from the main branch.

No secrets should be committed. Keep local values in `.env.local`.
