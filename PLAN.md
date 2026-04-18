# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me). **Phases 1–3 shipped.**

**Stack:** Next.js 16 + Tailwind 4, Neon Postgres (HTTP driver), Anthropic SDK direct (`claude-sonnet-4-6`), Zod validation, Vercel auto-deploy. Emerald-on-black editorial theme (Fraunces serif hero).

**Routes:**
- `/` — hero + AskMePanel + linked stat tiles (Users/Questions/Topics) + recent questions
- `/users` — user cards + join card
- `/[user]` — per-user log: serif name, inline stats (quizzes / streak / correct / top topic), interests, paginated question grid
- `/questions` — all questions, difficulty + topic filters, 3-tile stats reflecting filter state, paginated
- `/questions/[id]` — question detail with attribution link back to `/@user`
- `/api/quiz/new` + `/api/quiz/grade` — Zod-validated, parameterized by username

**Shared infra:**
- `<QuestionList />` — one grid for homepage / `/questions` / `/[user]`
- `<Pagination />` — generic, callback-driven
- `<BrandBar compact />` — tighter variant on non-home pages
- `<SiteFooter />` — persistent Home · Users · Questions nav
- `<BackButton />` — history-aware with fallback href
- 308 redirect `/:user/q/:id → /questions/:id` for backward compat

**Data:** `users` + `questions` tables, seeded from `users.json`. 2 users (Monte claimed, Suvarcha unclaimed with invite `SU-CC23CA`), 11 interests, ~33 questions. Skill at [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) writes `users.json` + commits; `pnpm db:seed` rebuilds Postgres on demand.

**De-monte'd:** hardcoded `"monte"` gone from API routes, AskMePanel, UserCard, question URLs. Auth plumbing is ready.

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage | **Neon Postgres** (runtime truth); `users.json` = seed + version-controlled snapshot |
| 2 | Auth | Plain-text password, HMAC-signed cookie session (no library). Phase 4. |
| 3 | Invite flow | Skill generates + commits invite code; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = landing; `/users`, `/[user]`, `/questions`, `/questions/[id]` |
| 5 | Public vs private | All browsing public. Ask/answer/claim requires session (Phase 4+). |
| 6 | Claude API | Serverless only; `ANTHROPIC_API_KEY` in Vercel env |
| 7 | Voice | Web Speech API later; v1 = text + Y/N buttons |
| 8 | Rate limit | 20 quizzes/user/day (Phase 4 with auth) |
| 9 | Skill writes | `users.json` only; Postgres is runtime DB; no dual-write |
| 10 | LLM SDK | `@anthropic-ai/sdk` direct |
| 11 | Validation | **Zod** for API bodies + Claude output schemas |

---

## Phases

*No active phase right now — reprioritize from the menu below.*

### Phase 4: Auth + multi-user writes
- HMAC-signed cookie sessions (no library), middleware attaches `user`
- `POST /api/users/claim`, `/login`, `/logout`
- Gate `/api/quiz/*` on session; remove `username` from request body
- Claim flow UI on `/[user]?invite=XXX`
- Rate limit 20/user/day in Postgres
- **Exit:** Suvarcha claims her account and asks her first question

### Phase 5: Guest flow + homepage live demo
- `POST /api/quiz/try` — unauthed generate + grade using Monte's interests, no persistence
- Homepage: random Monte question on load (reveal pattern) + "Try your own" → guest API → "Create an account to save this" modal

### Phase 6: Charts + voice + leaderboard
- `/[user]/stats` — Recharts: daily bar (stacked by difficulty), 7-day correct-rate line, topic breakdown, stat tiles
- Voice input via Web Speech API
- Homepage leaderboard: streak / correct-rate / total
- Per-user custom accent color

### Phase 7: Image mode + polish
- `/api/quiz/new` handles `medium=image` via `nano-banana`; Vercel Blob for storage
- OG cards per question
- Spaced repetition: `result=wrong` resurfaces at 3/7/30 days
- Custom domain (`quizme.xyz`?)

---

## Backlog

- **Topic display names** — `displayName` field on interests; UI falls back to title-cased slug
- **Prev/next nav on question detail** — fast browse from `/questions`
- **Shared questions** — "question of the day" all users see; compare answers
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
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate and ask about it? Decide before Phase 7.
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set.

---

*Updated: 2026-04-18*
