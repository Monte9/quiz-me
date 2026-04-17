# Phase 2.0 — Web Quiz Flow (Monte-only, no auth)

**Goal:** Click a button on the site → Claude generates a question → answer in the browser → Claude grades → result lands in Monte's log. No auth, no multi-user. Hardcoded to `monte`.

**Why this first:** The hardest part is the LLM quiz loop (prompt design, answer-key persistence, grading). Build it once, prove it works, then layer auth on top.

---

## Scope

**In:**
- Neon Postgres as runtime truth
- Two API routes: `POST /api/quiz/new`, `POST /api/quiz/grade`
- One-time seed script: `users.json` → Postgres
- Minimal UI: "Ask me a question" button with difficulty picker, answer input, reveal card
- Skill continues writing `users.json` (for version control) + mirrors to Postgres
- Switch Next.js out of static-export mode

**Out (deferred to 2.1+):**
- Auth, sessions, claim flow
- Multi-user writes from the web
- Rate limiting
- Guest flow, homepage demo
- Image medium (Phase 4)

---

## Monte's setup checklist

Before I start building, I need these provisioned. Flag me when each is ready:

1. **Neon project**
   - Go to [console.neon.tech](https://console.neon.tech) → New Project → name: `quiz-me`, region: US West (same as Vercel by default)
   - Copy the **pooled connection string** (`postgresql://...pooler.neon.tech/...?sslmode=require`)
2. **Vercel env vars** (project: `quiz-me`)
   - `DATABASE_URL` = pooled Neon connection string
   - `ANTHROPIC_API_KEY` = your existing Anthropic API key
   - Apply to: Production, Preview, Development
3. **Local env** (`.env.local` in repo root, gitignored)
   - Same two vars so `pnpm dev` works locally
   - Same vars in your shell profile so the skill can write to Postgres from the terminal

Nothing else on your end. I'll handle schema, migrations, seed, deploy.

---

## Schema

Single migration. Two tables. Mirrors `users.json` shape.

```sql
-- migrations/001_init.sql

create table users (
  username      text primary key,
  display_name  text not null,
  created_at    timestamptz not null,
  claimed_at    timestamptz,
  password      text,                   -- plaintext for v1 (Phase 2.1)
  invite_code   text unique,
  interests     jsonb not null default '[]'::jsonb  -- [{name, addedAt}]
);

create table questions (
  id                    text primary key,        -- YYYYMMDD-HHmmss-<slug>
  username              text not null references users(username) on delete cascade,
  difficulty            text not null,           -- easy|medium|hard|xhard
  medium                text not null,           -- text|image
  topic                 text not null,
  question              text not null,
  answer_key            text not null,
  user_answer           text,
  result                text,                    -- correct|partial|wrong|skipped|null
  thoughtfulness_score  int,                     -- 1-5 xhard only
  image_path            text,
  grade                 text,
  status                text not null default 'pending',  -- pending|graded|skipped
  created_at            timestamptz not null,
  graded_at             timestamptz
);

create index questions_username_created_at on questions (username, created_at desc);
```

**Notes:**
- `interests` as JSONB keeps the existing shape; no need to split into a separate table yet.
- `status = 'pending'` covers the window between `/quiz/new` (question generated, awaiting answer) and `/quiz/grade`. If the user abandons, pending rows sit there — fine for v1.
- `id` stays as the kebab timestamp slug the skill already produces; Postgres doesn't care.

---

## Seed

One-shot script: `scripts/seed-from-json.ts`. Run with `pnpm tsx scripts/seed-from-json.ts`.

Behavior:
- Read `users.json`.
- `insert on conflict do update` into `users` and `questions` so it's idempotent.
- Log row counts.

This is how we bootstrap Postgres from the current `users.json`. After initial run, the skill's dual-write keeps them aligned; we can re-run seed anytime as a disaster-recovery reset.

---

## API routes

Both routes are serverless (Next.js route handlers under `src/app/api/`). Both hardcode `username = 'monte'` for Phase 2.0.

### `POST /api/quiz/new`

**Request:**
```json
{ "difficulty": "easy|medium|hard|xhard", "topic": "optional" }
```

**Behavior:**
1. Load `users.monte` from Postgres (interests, recent 5 question topics).
2. Pick topic: `body.topic` if provided and in interests; else rotate — pick an interest not in the last 5 question topics.
3. Call Claude (`claude-sonnet-4-6`, system prompt per difficulty — see [Prompts](#prompts) below). Ask for strict JSON: `{ question, answerKey, topic }`.
4. Generate `id = YYYYMMDD-HHmmss-<slug>`.
5. Insert row with `status = 'pending'`, `user_answer = null`, `result = null`.
6. Return `{ questionId, question, difficulty, topic }` — **answerKey stays server-side.**

**Errors:** 400 on bad difficulty; 500 on Claude failure (don't persist on failure).

### `POST /api/quiz/grade`

**Request:**
```json
{ "questionId": "20260417-...", "userAnswer": "string or empty for skip" }
```

**Behavior:**
1. Load pending row by `questionId`. If missing or not pending → 404 / 409.
2. If `userAnswer` empty/whitespace → update row: `result='skipped'`, `status='skipped'`, `graded_at=now()`. Return `{ result: 'skipped' }`.
3. Else call Claude with the question, answerKey, and user's answer. System prompt differs by difficulty:
   - `easy|medium|hard` → return `{ result, grade }` where `result ∈ {correct, partial, wrong}` and `grade` is one-line feedback.
   - `xhard` → return `{ thoughtfulnessScore: 1-5, grade }`, `result = null`.
4. Update row: `user_answer`, `result`, `thoughtfulness_score`, `grade`, `status='graded'`, `graded_at=now()`.
5. Return `{ result, grade, thoughtfulnessScore, answerKey }`.

**Errors:** 404 on unknown id; 409 if already graded; 500 on Claude failure (leave row pending, let user retry).

---

## Prompts

Keep prompts in `src/lib/prompts.ts` as named templates. One per (action × difficulty) pair.

Principles (carry over from the skill):
- Questions should match the difficulty shape exactly — easy = yes/no, medium = one-word answer, hard = short-essay concept, xhard = propose a solution with 1–2 paragraphs of context.
- For xhard: the prompt must produce a question body that *includes* the context paragraphs.
- Rotate-avoidance is done in code (topic picker), not prompt.
- Grading: "don't be sycophantic. the friend who actually tells you when you're wrong."

First pass: copy-paste the rubric language from [SKILL.md](../../ash-core/skills/quiz-me/SKILL.md) into the system prompts. Iterate once we see output quality.

---

## Skill dual-write

The skill stays as-is with one addition: after writing `users.json` and committing, it also writes to Postgres using the same `DATABASE_URL`.

```ts
// ash-core/skills/quiz-me/lib/pg.ts (new)
// Tiny helper: upsert user, insert question, same row shape as API.
```

Order: `users.json` commit first (source of truth for git history), then Postgres write (source of truth for website). If Postgres write fails, skill logs and continues — seed script can reconcile later.

**Why dual-write:** version-controlled snapshots of the log remain in git; Postgres is just the hot read path for the website. We never lose data if one side fails.

---

## UI changes

Minimal — no separate page. An "Ask me a question" button appears on `/` (in the compact dashboard) and `/monte` (full dashboard). For Phase 2.0, always visible since we're skipping auth.

**Component:** `<AskMePanel />` — client component.

**States:**
1. **Idle** — button row: `[Easy] [Medium] [Hard]` + small `xhard` link. (Topic picker is a disclosure below, collapsed by default.)
2. **Loading** — skeleton while `/api/quiz/new` runs (~3-6s for Claude).
3. **Asking** — question card (Fraunces serif for the question, emerald accent) + textarea + `[Submit]` / `[Skip]` buttons.
4. **Grading** — skeleton while `/api/quiz/grade` runs.
5. **Revealed** — grade card: result pill (correct / wrong / skipped), one-line grade, "Show answer key" disclosure, `[Ask another]` button.

After `Revealed` → `[Ask another]` resets to Idle. The question also appears in the log list on next page load (or we can optimistically prepend it).

**No client-side state persistence.** Refresh mid-quiz = lose the pending question (it stays in DB as `pending` but UI won't recover). Fine for v1.

---

## Deploy changes

- **`next.config.ts`:** remove `output: "export"`. Keep defaults (server-mode on Vercel).
- **Pages that were fully static** (`/`, `/users`, `/monte`, `/[user]`, `/[user]/q/[id]`): keep as Server Components with default caching. No ISR revalidation needed — Postgres reads on each request are fast enough for v1.
- **`src/lib/users.ts`:** refactor to read from Postgres instead of `users.json`. Keep the same `User`, `Question`, `UserStats` shapes so UI components don't change. Add a new `src/lib/db.ts` with the Neon client.
- **Package adds:** `@neondatabase/serverless`, `@anthropic-ai/sdk`, `tsx` (dev).
- **Gitignore:** `.env.local` (should already be).

---

## Build order

1. **DB foundation** — `src/lib/db.ts`, migration file, `pnpm db:migrate` script, `scripts/seed-from-json.ts`. Run locally against Neon dev branch to verify. (No code changes to UI yet.)
2. **Read-path swap** — refactor `src/lib/users.ts` to read from Postgres. Site still renders identically. Deploy this first and confirm nothing broke.
3. **API routes** — `/api/quiz/new`, `/api/quiz/grade`. Test via curl. Confirm rows land in Postgres.
4. **UI** — `<AskMePanel />`, wire into homepage + `/monte`. End-to-end test.
5. **Skill dual-write** — add Postgres write to the skill so terminal quizzes also hit the DB. Confirm both paths produce the same row shape.

Each step is a PR. Steps 1-2 are invisible to visitors; 3-4 are the shipped feature; 5 keeps the skill in sync.

---

## Open questions (pre-build)

- **Model choice.** `claude-sonnet-4-6` for generation + grading, or `opus-4-7` for xhard grading only? Recommend: sonnet for everything in Phase 2.0, revisit after we see xhard grading quality.
- **Topic UX.** Three buttons (easy/medium/hard) with xhard as secondary link, or a single "Ask me" button that picks difficulty randomly? Recommend: three buttons. Monte picks his mood.
- **Pending cleanup.** Abandoned `pending` rows accumulate. Leave them for now (cheap) or add a 1-hour cleanup job? Recommend: leave for v1; add cleanup if it becomes noise.
- **Image medium (Phase 4 scope).** Confirm it stays out of 2.0.

---

## Exit criteria

- You land on quizmenexus.vercel.app.
- Click "Ask me medium" on the hero.
- See a real Claude-generated question within ~6s.
- Type an answer, submit.
- See a grade within ~4s.
- Refresh the page — your new question is in Monte's log.
- Run `quiz me` in the terminal; same flow, same row in Postgres, same commit to `users.json`.

---

*Spec drafted: 2026-04-17*
