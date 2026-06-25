# Ticket Classification

Next.js API project for classifying support tickets by category, priority, and destination team.

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
  "title": "Payment failed",
  "description": "My invoice payment failed and I need help urgently.",
  "customerEmail": "customer@example.com"
}
```

Example response:

```json
{
  "ticket": {
    "category": "billing",
    "priority": "urgent",
    "confidence": 0.7,
    "reasons": [
      "Matched 2 billing keyword(s).",
      "Matched 2 urgent priority keyword(s)."
    ],
    "routedTo": "billing-support"
  }
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
  -d '{"description":"I was charged twice and need a refund urgently."}'
```

## Environment

Put local API keys in `.env.local`. This file is ignored by git.

```bash
OPENAI_API_KEY=
```

## Notes

The classifier currently uses regex rules in `lib/classifier.ts`. Replace or extend that module when the LLM integration is ready.
