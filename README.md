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

Classifies a ticket using the current regex-based classifier.

Example body:

```json
{
  "ticket_id": "TICKET-123",
  "channel": "web",
  "locale": "en",
  "message": "Payment failed but I was charged twice and need a refund."
}
```

Example response:

```json
{
  "ticket_id": "TICKET-123",
  "case_type": "payment_failed",
  "severity": "high",
  "department": "payments_ops",
  "agent_summary": "Customer reports a payment failed issue: Payment failed but I was charged twice and need a refund. Current severity is high.",
  "human_review_required": false,
  "confidence": 0.63
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
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

## Environment

Put local API keys in `.env.local`. This file is ignored by git.

```bash
OPENAI_API_KEY=
```

## Notes

The classifier currently uses regex rules in `lib/classifier.ts`. Replace or extend that module when the LLM integration is ready. See `IMPLEMENTATION.md` for the full module plan, schema, safety rule, and runbook.
