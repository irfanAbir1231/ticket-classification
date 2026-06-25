# Person 1 Detailed Implementation Steps

This is the step-by-step implementation plan for the Infrastructure and Ops
track. Each step is intentionally small so it can be implemented separately.

## Branch

Use this branch:

```bash
person-1-infrastructure-ops
```

## Owned Scope

Person 1 should mainly touch:

- `app/api/health/route.ts`
- `.env.local`
- `.env.example`
- `.gitignore`
- `README.md`
- Optional deployment config files, if needed later

Avoid changing:

- `app/api/sort-ticket/route.ts`
- `lib/classifier.ts`
- `types/index.ts`

Those belong to Person 2 and Person 3 unless a final integration fix is needed.

## Step 1: Verify Infrastructure Baseline

Goal: Confirm the project is runnable before changing behavior.

Tasks:

- Check the current branch.
- Check the working tree status.
- Confirm `package.json` has `dev`, `build`, `start`, and `lint` scripts.
- Confirm the App Router folder exists at `app/`.
- Confirm the health route file exists.

Commands:

```bash
git branch --show-current
git status --short
npm run lint
npx tsc --noEmit
```

Acceptance criteria:

- Current branch is `person-1-infrastructure-ops`.
- Lint passes.
- TypeScript passes.
- No unrelated files are modified.

## Step 2: Harden the Health Endpoint

Goal: Make `GET /api/health` reliable, fast, and useful for graders.

Tasks:

- Keep the handler dependency-free.
- Return HTTP `200`.
- Return a compact JSON payload with:
  - `status`
  - `service`
  - `timestamp`
  - `uptime_seconds`
  - `environment`
- Avoid checking databases, LLM APIs, or external services.
- Make sure the route cannot accidentally expose secrets.

Expected response shape:

```json
{
  "status": "ok",
  "service": "ticket-classification",
  "timestamp": "2026-06-25T00:00:00.000Z",
  "uptime_seconds": 12,
  "environment": "development"
}
```

Manual test:

```bash
curl http://localhost:3000/api/health
```

Acceptance criteria:

- Response is HTTP `200`.
- Response body includes all required fields.
- Endpoint does not import classifier code.
- Endpoint does not read or return API keys.

## Step 3: Add Environment Variable Template

Goal: Make local setup clear without committing secrets.

Tasks:

- Create `.env.example`.
- Include placeholder keys only.
- Keep `.env.local` ignored by git.
- Document that `.env.local` is for real local secrets.

Suggested `.env.example`:

```bash
# Copy this file to .env.local for local development.
# Never commit real secrets.

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
NODE_ENV=development
```

Acceptance criteria:

- `.env.example` is committed.
- `.env.local` remains untracked.
- `.gitignore` ignores `.env*` or at least `.env.local`.
- No real secret values appear in the repository.

## Step 4: Improve `.gitignore` Secret Safety

Goal: Prevent accidental commits of local secrets and generated build output.

Tasks:

- Confirm these entries exist:
  - `node_modules`
  - `.next`
  - `.env*`
  - `*.tsbuildinfo`
  - `next-env.d.ts`
- Add explicit comments for env files if missing.
- Ensure `.env.example` can still be committed if needed.

Recommended pattern:

```gitignore
# env files
.env*
!.env.example
```

Acceptance criteria:

- `.env.local` is ignored.
- `.env.example` is trackable.
- Build output remains ignored.

## Step 5: Add Local Runbook to README

Goal: Let any teammate or grader run the project locally.

Tasks:

- Add or refine a `Local Development` section.
- Include install, lint, typecheck, dev server, and health check commands.
- Mention the default local URL.
- Mention how to create `.env.local` from `.env.example`.

Required commands in README:

```bash
npm install
npm run lint
npx tsc --noEmit
npm run dev
curl http://localhost:3000/api/health
```

Acceptance criteria:

- README has clear local setup instructions.
- Commands are copy-pasteable.
- Health check instructions use `/api/health`.

## Step 6: Add Deployment Runbook to README

Goal: Make redeployment possible if the live URL fails during grading.

Tasks:

- Add or refine a `Deployment` section.
- Use Vercel as the recommended target.
- Explain GitHub import, default build settings, and env variables.
- Include post-deploy health check command.
- Include a short rollback/redeploy note.

Recommended Vercel settings:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Post-deploy check:

```bash
curl https://YOUR_DEPLOYMENT_URL/api/health
```

Acceptance criteria:

- README explains how to deploy from a fresh clone.
- README explains where production env vars go.
- README includes a health check against the deployed URL.

## Step 7: Add Ops Troubleshooting Notes

Goal: Give graders and teammates fast recovery guidance.

Tasks:

- Add a `Troubleshooting` section to README.
- Include common failures:
  - dependency install fails
  - port `3000` already in use
  - env variable missing
  - deployment health check fails
- Keep fixes short and command-oriented.

Useful commands:

```bash
npm install
npm run build
npm run dev -- -p 3001
curl http://localhost:3001/api/health
```

Acceptance criteria:

- README has a short troubleshooting section.
- Each issue has a direct next action.

## Step 8: Verify Production Build

Goal: Catch deployment-breaking issues before pushing.

Tasks:

- Run lint.
- Run TypeScript check.
- Run production build.

Commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Acceptance criteria:

- All commands pass.
- No secrets are printed in output.
- No Person 2 or Person 3 files are changed unexpectedly.

## Step 9: Optional Smoke Test With Local Server

Goal: Confirm the health endpoint works through the actual Next.js dev server.

Tasks:

- Start the dev server.
- Call `/api/health`.
- Stop the dev server when finished.

Commands:

```bash
npm run dev
curl http://localhost:3000/api/health
```

Acceptance criteria:

- Health route returns JSON.
- Response time is comfortably under 10 seconds.
- No external API key is required.

## Step 10: Final Person 1 Handoff

Goal: Leave a clean branch ready for review or merge.

Tasks:

- Check branch status.
- Summarize changed files.
- Confirm verification commands.
- Write a concise handoff note for Person 2 and Person 3.

Commands:

```bash
git status --short
git diff --stat
npm run lint
npx tsc --noEmit
```

Acceptance criteria:

- Branch contains only infrastructure and ops changes.
- README has local and deployment runbooks.
- Health endpoint is stable.
- `.env.example` exists.
- `.env.local` remains ignored.

## Suggested Implementation Order

1. Step 1: Verify Infrastructure Baseline
2. Step 2: Harden the Health Endpoint
3. Step 3: Add Environment Variable Template
4. Step 4: Improve `.gitignore` Secret Safety
5. Step 5: Add Local Runbook to README
6. Step 6: Add Deployment Runbook to README
7. Step 7: Add Ops Troubleshooting Notes
8. Step 8: Verify Production Build
9. Step 9: Optional Smoke Test With Local Server
10. Step 10: Final Person 1 Handoff

## How to Ask for the Next Step

Use commands like:

```text
Implement Person 1 step 2.
Implement Person 1 step 3 and step 4.
Run Person 1 verification.
```
