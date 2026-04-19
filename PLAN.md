# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me). **Phases 1–4 shipped.**

**Stack:** Next.js 16 + Tailwind 4, Neon Postgres (HTTP driver), Anthropic SDK direct (`claude-sonnet-4-6`), Zod validation, Vercel auto-deploy. Emerald-on-black editorial theme (Fraunces serif hero).

**Routes:**
- `/` — hero + AskMePanel + stat tiles (Users/Questions/Topics) + recent questions
- `/users` — user cards + join card
- `/[user]` — per-user log: serif name, inline stats, interests, paginated questions
- `/questions` — all questions, difficulty + topic filters, stats reflect filter state
- `/questions/[id]` — question detail with attribution link back to `/[user]`
- `/api/quiz/new` + `/api/quiz/grade` — Zod-validated, parameterized by username

**Question mechanics (Phase 4):**
- **Topic-scoped dedup** — last 20 questions on the picked topic passed to Claude with "do not repeat or paraphrase."
- **Multiple choice (easy + medium)** — easy = binary Yes/No, medium = 4 plausible distractors from same category/era. `options jsonb` + `correct_index int` on questions (migration 002). Grading is **instant** (direct index compare, no LLM call); `correctIndex` never leaves the server.
- **Freeform (hard + xhard)** — unchanged; LLM grades with difficulty-specific rubrics.
- **Discover mode** — topic picker has `random` (user's interests), `discover` (Claude picks fresh, excludes interests ∪ all past-quizzed topics), or a specific topic. Discover's picked topic is stored on the row, so the discovery pool keeps shrinking with play.

**Shared infra:** `<QuestionList />`, `<Pagination />`, `<BrandBar compact />`, `<SiteFooter />`, `<BackButton />` (history-aware), 308 redirect `/:user/q/:id → /questions/:id`.

**Data:** `users` + `questions` tables, seeded from `users.json`. 2 users (Monte claimed, Suvarcha unclaimed with invite `SU-CC23CA`), 11 interests. Skill at [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) writes `users.json` + commits; `pnpm db:seed` rebuilds Postgres on demand.

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage | **Neon Postgres** (runtime truth); `users.json` = seed + versioned snapshot |
| 2 | Auth | Plain-text password, HMAC-signed cookie session (no library). Deferred. |
| 3 | Invite flow | Skill generates + commits invite code; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` landing; `/users`, `/[user]`, `/questions`, `/questions/[id]` |
| 5 | Public vs private | All browsing public. Ask/answer/claim gated on session when auth lands. |
| 6 | Claude API | Serverless only; `ANTHROPIC_API_KEY` in Vercel env |
| 7 | Voice | Web Speech API later; v1 = text + buttons |
| 8 | Rate limit | 20 quizzes/user/day (with auth) |
| 9 | Skill writes | `users.json` only; no dual-write |
| 10 | LLM SDK | `@anthropic-ai/sdk` direct |
| 11 | Validation | **Zod** for API bodies + Claude output schemas |
| 12 | Dedup scope | Topic-scoped, last 20 questions |
| 13 | Grading path | Instant index-compare for easy/medium MC; LLM for hard/xhard |
| 14 | Discover scope | Excludes user's interests AND every past-quizzed topic |

---

## Phases

### Phase 5 (queued): UX polish round 2

TBD — Monte to populate after more dogfood with Su. Likely candidates from the backlog: prev/next nav on question detail, topic display names, skill ↔ web MC coherence.

---

## Backlog

**Skill coherence gap** — `ash-core/skills/quiz-me/SKILL.md` writes freeform questions to `users.json`; the web UI now generates MC for easy/medium. Skill should emit `options` + `correctIndex` for easy/medium so skill-written and web-written questions have the same shape.

**Parked phases** (previously active, deprioritized in favor of UX-first direction):

- **Auth + multi-user writes** — HMAC-signed cookie sessions, `/login`/`/logout`, `POST /api/users/claim`, gate `/api/quiz/*` on session, claim flow UI on `/[user]?invite=XXX`, rate limit 20/user/day. Needed before Su can drive her own account.
- **Guest flow + homepage demo** — `POST /api/quiz/try` (unauthed, no persist), homepage loads a random Monte question on arrival, "Try your own" → guest API → "create account to save" modal.
- **Charts + voice + leaderboard** — `/[user]/stats` with Recharts (daily bar, 7-day correct-rate line, topic breakdown), voice input via Web Speech, homepage leaderboard, per-user accent color.
- **Image mode + polish** — `medium=image` via nano-banana + Vercel Blob, OG cards per question, spaced repetition, custom domain.

**Smaller ideas:**

- **Prev/next nav on question detail** — fast browse from `/questions`
- **Topic display names** — `displayName` on interests; UI falls back to title-cased slug
- **MC grading transparency** — when user picks wrong, optional one-liner explaining the right answer (one LLM call per wrong MC)
- **Shared questions** — "question of the day" all users see; compare answers
- **Admin panel** — Monte generates invites from web UI (skill-only today)
- **Topic hierarchy** — `history/roman`, `ai/transformers`
- **Session mode** — "quiz me 5 hard" → batch of 5
- **Export wrong answers to Anki**
- **Difficulty auto-calibration per topic** — bump `medium X` → `hard` when you're crushing it
- **Bcrypt passwords** once > 2 users
- **Shareable grade cards** — OG image per question for social
- **Weekly recap email** — streak, correct-rate, top-missed topic

---

## Open Questions

- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before first xhard runs.
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate and ask about it?
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set (when auth lands).

---

*Updated: 2026-04-18*
