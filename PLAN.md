# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me). Phase 1 shipped 2026-04-17; Phase 2.0 is mid-build (3 of 5 steps done).

**Phase 1 — shipped:**
- Next.js 16 + Tailwind 4, Vercel auto-deploy, emerald-on-black editorial theme (Fraunces serif hero, number-forward stat blocks)
- Pages: `/` (landing + Monte's log), `/users` (all users + join card), `/[user]` (dashboard or claim-stub), `/[user]/q/[id]` (question detail)
- 2 users seeded (Monte claimed, Suvarcha unclaimed with invite `SU-CC23CA`), 11 interests, 1 real quiz
- Writer skill at [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — writes `users.json` + commits

**Phase 2.0 — in progress:**
- ✅ **Step 1** — Neon Postgres foundation: `users`/`questions` tables + index, `src/lib/db.ts`, `pnpm db:migrate` + `db:seed` scripts, seeded from `users.json`
- ✅ **Step 2** — Read path swap: dropped `output: "export"`, server-mode deploy, `src/lib/users.ts` reads from Postgres (users.json kept as git-tracked seed)
- ✅ **Step 3** — API routes: `POST /api/quiz/new` + `POST /api/quiz/grade` live on Vercel, `src/lib/claude.ts` (lazy-init) + `src/lib/prompts.ts` (per-difficulty) + `src/lib/quiz.ts` (topic picker, id/slug). First curl-driven quiz: `20260417-165935-kitchen-both-sides` (pickleball).
- ⬜ **Step 4** — `<AskMePanel />` client UI on `/` + `/monte` (Idle → Loading → Asking → Grading → Revealed) + Zod hardening pass (request bodies + Claude output schemas, replace `isDifficulty` guard)
- ⬜ **Step 5** — Skill dual-write: teach SKILL.md to mirror into Postgres alongside `users.json` commit

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage | **Neon Postgres** (runtime truth); `users.json` remains seed + version-controlled snapshot |
| 2 | Auth | Plain-text password, signed-cookie session (HMAC, no library). Deferred to Phase 2.1. |
| 3 | Invite flow | Invite code generated + committed by skill; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = landing + Monte's log; `/users` = all users; `/[user]` = per-user |
| 5 | Public vs private | All browsing public. Ask/answer/claim requires session (Phase 2.1+). |
| 6 | Claude API | Serverless only; `ANTHROPIC_API_KEY` in Vercel env; never client-side |
| 7 | Voice | Phase 3 via Web Speech API. v1 = text + Y/N buttons. |
| 8 | Rate limit | 20 quizzes/user/day (added in Phase 2.1 with auth) |
| 9 | Skill writes | Dual-write: `users.json` (commit) AND Postgres (direct via `DATABASE_URL`) |
| 10 | LLM SDK | `@anthropic-ai/sdk` direct. Vercel AI SDK skipped — overkill for two `messages.create` calls, no streaming/tools. |
| 11 | Validation | **Zod** for API bodies + Claude output schemas (folded into Step 4) |

---

## Phases

### Phase 2.0 (active): Web quiz flow — Monte only, no auth

**Spec:** [specs/phase-2-backend.md](specs/phase-2-backend.md)

Steps 1–3 shipped. Remaining:

- **Step 4 — `<AskMePanel />` + Zod**
  - Client component at `src/components/AskMePanel.tsx`, wired into `/` and `/monte`
  - States: Idle (`[Easy] [Medium] [Hard]` buttons + `xhard` link + topic disclosure) → Loading → Asking (question in Fraunces + textarea + Submit/Skip) → Grading → Revealed (result pill + one-line grade + "Show answer key" + "Ask another")
  - `pnpm add zod`; schema-validate NewBody/GradeBody + GenOutput/EasyMedHardGrade/XHardGrade; refactor `callJSON<T>` to accept a zod schema; drop manual `isDifficulty` guard
- **Step 5 — Skill dual-write**
  - Skill continues writing `users.json` + commits, **and** inserts into Postgres via direct connection (skill gets `DATABASE_URL` in local env)
  - Verify: skill-generated question shows on the site immediately, and in git history

**Exit:** Land on quizmenexus.vercel.app → click "Ask me medium" → answer → see Ash's grade → refresh → it's in your log. Skill-generated questions show up the same way.

### Phase 2.1: Auth + multi-user writes

- `POST /api/users/claim`, `/login`, `/logout`; HMAC-signed cookie sessions, middleware attaches `user`
- Gate `/api/quiz/*` on session
- Claim flow UI on `/[user]?invite=XXX`
- Rate limit: 20/user/day in Postgres
- Suvarcha claims, asks her first question

### Phase 2.2: Guest flow + homepage live demo

- `POST /api/quiz/try` (unauthed) — generate + grade using Monte's interests, don't persist
- Homepage: on load pick a random Monte question → reveal pattern; "Try your own" → guest API → modal "Create an account to save this"

### Phase 3: Charts + voice + leaderboard

- `/[user]/stats` — Recharts: daily bar (stacked by difficulty), 7-day correct-rate line, topic breakdown, stat tiles
- Voice input via Web Speech API
- Homepage leaderboard: streak / correct-rate / total
- Per-user custom accent color

### Phase 4: Image mode + polish

- `/api/quiz/new` handles `medium=image` via `nano-banana`; Vercel Blob for storage
- OG cards per question
- Spaced repetition: `result=wrong` resurface at 3/7/30 days
- Custom domain (`quizme.xyz`?)

---

## Backlog

- **Shared questions** — "question of the day" seen by all users; compare answers
- **Admin panel** — Monte generates invites from web UI (skill-only today)
- **Topic hierarchy** — `history/roman`, `ai/transformers`
- **Session mode** — "quiz me 5 hard" → batch of 5
- **Export wrong answers to Anki**
- **Difficulty auto-calibration per topic** — Ash bumps `medium indian-mythology` → `hard` when you're crushing it
- **Bcrypt passwords** once > 2 users
- **Invite-code resend** if lost
- **Shareable grade cards** — OG image per question for social
- **Weekly recap email** — streak, correct-rate, top-missed topic

---

## Open Questions

- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before first xhard runs.
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate and ask about it? Decide before Phase 4.
- **Difficulty/medium picker UX** — three default buttons (easy/medium/hard) + settings disclosure for topic/xhard feels right; validate once Step 4 ships.
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set.

---

*Updated: 2026-04-17*
