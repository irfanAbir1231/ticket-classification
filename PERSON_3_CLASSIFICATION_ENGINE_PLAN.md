# Person 3 Implementation Plan: Classification Engine

## Role

Own the core ticket classification logic. The API route should be able to pass a
customer message into this module and receive structured classification data.

## Owned Files

- `lib/classifier.ts`
- `README.md` classification logic section

## Goal

Implement:

```ts
classifyTicket(message: string)
```

The function must return:

- `case_type`
- `severity`
- `department`
- `agent_summary`
- `human_review_required`
- `confidence`

## Input

The function receives only the customer message:

```ts
const result = classifyTicket("I sent money to the wrong recipient.");
```

Do not depend on HTTP request objects inside this file.

## Output Contract

Example:

```json
{
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "Customer reports a wrong transfer issue: I sent money to the wrong recipient. Current severity is high.",
  "human_review_required": false,
  "confidence": 0.63
}
```

## Case Types

Return exactly one of:

- `wrong_transfer`
- `payment_failed`
- `refund_request`
- `phishing_or_social_engineering`
- `other`

Suggested matching logic:

- `wrong_transfer`: wrong recipient, wrong account, sent to wrong number,
  mistaken transfer, incorrect recipient
- `payment_failed`: payment failed, transaction failed, declined, could not pay,
  charged but failed
- `refund_request`: refund, money back, reverse charge, cancel payment, charged
  twice, duplicate charge
- `phishing_or_social_engineering`: OTP, PIN, password, phishing, scam, asked for
  credentials, asked for card details
- `other`: no confident match

## Severity

Return exactly one of:

- `low`
- `medium`
- `high`
- `critical`

Rules:

- `critical`: phishing/social engineering, OTP/PIN/password/credential theft,
  fraud, account takeover, scam
- `high`: wrong transfer, urgent issue, blocked customer, duplicate charge, large
  amount
- `medium`: failed payment, refund request, pending payment, general payment
  problem
- `low`: general or unclear requests

## Department Mapping

Map case type to department:

| Case Type | Department |
| --- | --- |
| `wrong_transfer` | `dispute_resolution` |
| `payment_failed` | `payments_ops` |
| `refund_request` | `customer_support` |
| `phishing_or_social_engineering` | `fraud_risk` |
| `other` | `customer_support` |

## Human Review Rule

`human_review_required` must be `true` when:

- `severity` is `critical`
- `case_type` is `phishing_or_social_engineering`

Otherwise, return `false`.

## Agent Summary

Generate a neutral 1-2 sentence summary.

The summary must:

- Describe the customer issue.
- Avoid promises, legal claims, or payment guarantees.
- Avoid asking for PINs, OTPs, passwords, or full card numbers.
- Stay short enough for an agent dashboard.

Safe example:

```text
Customer reports a failed payment issue after being charged. Current severity is high.
```

Unsafe example:

```text
Ask the customer to share their OTP and full card number.
```

## Confidence

Return a float between `0` and `1`.

Suggested scoring:

- `0.35` for no clear case match.
- `0.55` to `0.75` for one or two keyword matches.
- `0.8` to `0.95` for strong phishing, fraud, or multiple matching signals.

## Implementation Options

### Recommended for 1-Hour Sprint

Use rule-based regex logic. It is fast, deterministic, easy to review, and does
not require an API key.

### Later Upgrade

Replace regex detection with an LLM call while preserving the same exported
function and return type. Keep the safety filter in Person 2's route even after
adding an LLM.

## Manual Test Cases

Wrong transfer:

```ts
classifyTicket("I transferred money to the wrong recipient.");
```

Expected:

- `case_type`: `wrong_transfer`
- `department`: `dispute_resolution`

Payment failed:

```ts
classifyTicket("My transaction failed but my balance was deducted.");
```

Expected:

- `case_type`: `payment_failed`
- `department`: `payments_ops`

Phishing:

```ts
classifyTicket("A caller asked me to share my OTP and password.");
```

Expected:

- `case_type`: `phishing_or_social_engineering`
- `severity`: `critical`
- `department`: `fraud_risk`
- `human_review_required`: `true`

## Acceptance Criteria

- `classifyTicket(message)` returns the required fields.
- All returned enum values match the exact allowed strings.
- `human_review_required` follows the required rule.
- `confidence` is always between `0` and `1`.
- The function has no dependency on Next.js request or response objects.
- `npm run lint` passes.
- `npx tsc --noEmit` passes.

## Handoff Notes

Person 2 imports this module from `@/lib/classifier`. Avoid changing the function
name or output shape unless coordinating with Person 2.
