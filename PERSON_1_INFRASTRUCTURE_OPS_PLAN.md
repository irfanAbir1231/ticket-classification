# Person 1 Implementation Plan: Infrastructure and Ops

## Role

Own the project foundation, health endpoint, environment variable setup, and deployment runbook.

## Owned Files

- `app/api/health/route.ts`
- `.env.local`
- `.gitignore`
- `README.md` deployment and local run sections
- Vercel project settings, if deploying

## Goals

- Keep the Next.js API project runnable locally.
- Provide a fast `GET /api/health` endpoint.
- Make sure secrets are handled through environment variables only.
- Document how to run and redeploy the project if the live URL fails.

## Current Route Contract

### `GET /api/health`

Expected response:

```json
{
  "status": "ok",
  "service": "ticket-classification",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

The endpoint must respond quickly and should not depend on external services.

## Implementation Checklist

- Confirm the project runs with `npm run dev`.
- Confirm `.env.local` exists for local secrets.
- Confirm `.env.local` is ignored by git through `.gitignore`.
- Keep `app/api/health/route.ts` simple and dependency-free.
- Add any needed API keys to Vercel environment variables, not source code.
- Add local run instructions to `README.md`.
- Add deployment replication instructions to `README.md`.

## Local Runbook

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected result: HTTP `200` with `status: "ok"`.

## Deployment Runbook

Recommended platform: Vercel.

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Select the default Next.js settings.
4. Add environment variables in Vercel project settings.
5. Deploy the main branch.
6. Test the deployed health endpoint:

```bash
curl https://YOUR_DEPLOYMENT_URL/api/health
```

## Environment Variables

Use `.env.local` locally:

```bash
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

Rules:

- Never commit real secrets.
- Never hardcode API keys in TypeScript files.
- Add production secrets through Vercel environment settings.

## Acceptance Criteria

- `npm run dev` starts successfully.
- `GET /api/health` returns HTTP `200`.
- `.env.local` is not tracked by git.
- The README contains local run and deployment recovery instructions.
- The health route still works even if classifier or LLM dependencies fail.

## Handoff Notes

Person 2 owns `POST /api/sort-ticket`, and Person 3 owns `lib/classifier.ts`.
Avoid editing those files unless coordinating a final integration fix.
