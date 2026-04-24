# quiz-me

Multi-user trivia log where Ash (Claude) quizzes you on topics you pick and grades honestly. Live at [quizmenexus.vercel.app](https://quizmenexus.vercel.app).

See [PLAN.md](./PLAN.md) for current state + roadmap and [BRAND.md](./BRAND.md) for copy/voice.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Neon Postgres (HTTP driver) · Anthropic SDK · Zod · Vercel.

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # fill in values — see below
pnpm db:migrate                     # idempotent, safe to re-run
pnpm db:seed                        # rebuild Postgres from users.json
pnpm dev
```

## Environment variables

Only two are actually required; everything else Vercel/Neon injects is noise.

| Var | Where used | Notes |
|---|---|---|
| `DATABASE_URL` | server runtime + `scripts/migrate.ts` + `scripts/seed-from-json.ts` | Neon pooled connection string |
| `ANTHROPIC_API_KEY` | `/api/quiz/*` | Used by `@/lib/claude` for generation + grading |

**Where to set:**
- **Local** — `.env.local` (gitignored)
- **Vercel** — Project → Settings → Environment Variables (Production + Preview)
- **GitHub Actions** — `DATABASE_URL` must be a repo secret for the migration workflow. Settings → Secrets and variables → Actions → New repository secret. `ANTHROPIC_API_KEY` is not needed in CI.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build locally |
| `pnpm db:migrate` | Apply all SQL in `migrations/` in order. Idempotent. |
| `pnpm db:seed` | Truncate + re-seed `users` + `questions` from `users.json` |

## Database

- Migrations live in `migrations/NNN_name.sql`, applied in filename order by `scripts/migrate.ts`.
- Every statement uses `if not exists` / safe `alter` so re-runs are no-ops.
- `users.json` is the versioned seed snapshot. Skill at `ash-core/skills/quiz-me/SKILL.md` writes to it; `pnpm db:seed` mirrors it into Postgres.

## CI

`.github/workflows/db-migrate.yml` runs `pnpm db:migrate` automatically on push to `main` when `migrations/**` or `scripts/migrate.ts` changes. Also exposed as `workflow_dispatch` so you can trigger it manually from the Actions tab (useful for re-applying against a new `DATABASE_URL` or after a seed reset).

**Setup checklist for CI:**
1. Add `DATABASE_URL` as a repo secret (see above)
2. First run: push a migration or click "Run workflow" in the Actions tab

## Deploy

Vercel auto-deploys `main`. Preview deploys on every PR. No manual deploy step.
