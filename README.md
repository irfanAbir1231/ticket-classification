# Ticket Classification

Next.js API project for classifying support tickets by case type, severity, and destination department.

## Project Structure

```text
ticket-classification/
├── app/
│   └── api/
│       ├── health/
│       │   └── route.ts
│       └── sort-ticket/
│           └── route.ts
├── lib/
│   └── classifier.ts
├── types/
│   └── index.ts
├── .env.local
├── README.md
├── package.json
└── tsconfig.json
```

## Team Ownership

- Person 1: `app/api/health/route.ts` and `.env.local`
- Person 2: `app/api/sort-ticket/route.ts`
- Person 3: `lib/classifier.ts`
- Shared: `types/index.ts` and README documentation

## API Routes

### `GET /api/health`

Returns service health information.

### `POST /api/sort-ticket`

Classifies a support ticket and routes it to the correct department.

#### Request Schema

| Field       | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| `ticket_id` | string | ✅ Yes   | Non-empty unique ticket identifier   |
| `message`   | string | ✅ Yes   | Non-empty customer message text      |
| `channel`   | string | ❌ No    | Originating channel (e.g. `"web"`)   |
| `locale`    | string | ❌ No    | Locale code (e.g. `"en"`)            |

Example request body:

```json
{
  "ticket_id": "TICKET-123",
  "channel": "web",
  "locale": "en",
  "message": "Payment failed but I was charged twice."
}
```

#### Response Schema

All fields are returned at the **top level** (not wrapped in a `ticket` object).

| Field                   | Type    | Description                                              |
|-------------------------|---------|----------------------------------------------------------|
| `ticket_id`             | string  | Echoed from the request                                  |
| `case_type`             | string  | One of: `wrong_transfer`, `payment_failed`, `refund_request`, `phishing_or_social_engineering`, `other` |
| `severity`              | string  | One of: `low`, `medium`, `high`, `critical`             |
| `department`            | string  | One of: `customer_support`, `dispute_resolution`, `payments_ops`, `fraud_risk` |
| `agent_summary`         | string  | Human-readable summary — safety-filtered before return  |
| `human_review_required` | boolean | Whether a human agent must review this ticket           |
| `confidence`            | number  | Classifier confidence score between `0` and `1`         |

Example response:

```json
{
  "ticket_id": "TICKET-123",
  "case_type": "payment_failed",
  "severity": "high",
  "department": "payments_ops",
  "agent_summary": "Customer reports a payment failed issue: Payment failed but I was charged twice. Current severity is high.",
  "human_review_required": false,
  "confidence": 0.63
}
```

#### Error Response (HTTP 400)

Returned when required fields are missing, have the wrong type, or when the request body is invalid JSON.

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

#### Safety Filtering

The `agent_summary` field is scanned before the response is sent. If the summary contains any language that could be read as instructing someone to share a PIN, OTP, password, or full card number, the summary is replaced with:

```text
Customer reports a sensitive account or payment issue. Do not request PINs, OTPs, passwords, or full card numbers from the customer.
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Health check:

```bash
curl http://localhost:3000/api/health
```

Ticket classification:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-001","message":"I was charged twice and need a refund urgently."}'
```

Missing required field (returns HTTP 400):

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-002"}'
```

Phishing / social engineering ticket:

```bash
curl -X POST http://localhost:3000/api/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-003","message":"Someone asked me to share my OTP and password."}'
```

## Environment

Put local API keys in `.env.local`. This file is ignored by git.

```bash
OPENAI_API_KEY=
```

## Notes

The classifier currently uses regex rules in `lib/classifier.ts`. Replace or extend that module when the LLM integration is ready. See `IMPLEMENTATION.md` for the full module plan, schema, safety rule, and runbook.
