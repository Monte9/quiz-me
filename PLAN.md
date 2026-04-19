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
| 2 | Auth | Plain-text password, HMAC-signed cookie session (no library). Deferred. |
| 3 | Invite flow | Skill generates + commits invite code; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = landing; `/users`, `/[user]`, `/questions`, `/questions/[id]` |
| 5 | Public vs private | All browsing public. Ask/answer/claim requires session when auth lands. |
| 6 | Claude API | Serverless only; `ANTHROPIC_API_KEY` in Vercel env |
| 7 | Voice | Web Speech API later; v1 = text + Y/N buttons |
| 8 | Rate limit | 20 quizzes/user/day (with auth) |
| 9 | Skill writes | `users.json` only; Postgres is runtime DB; no dual-write |
| 10 | LLM SDK | `@anthropic-ai/sdk` direct |
| 11 | Validation | **Zod** for API bodies + Claude output schemas |

---

## Phases

### Phase 4 (active): Question mechanics + quality

Real-world testing with Su over brunch surfaced three things that need to land before scaling to more users. Quality pass on what a question actually *feels like*.

- **P0 — Dedupe generated questions.** Questions repeat within a topic. When calling `/api/quiz/new`, pass the user's recent questions (last N per topic, or all in that topic) to Claude; prompt explicitly excludes them. Doesn't need to be perfect — reducing repeat rate is the goal.
- **P1 — Multiple choice for medium.** Medium as freeform text is too hard; Su struggled. Rebalance:
  - Easy = yes/no *(unchanged)*
  - **Medium = 4 choices, 1 correct** *(new)*
  - Hard = freeform text *(unchanged — already correct-graded)*
  - xHard = freeform thoughtfulness *(unchanged)*
  - DB: add `options` jsonb column on `questions` (nullable; only populated for new multiple-choice mediums). Existing mediums stay freeform (grandfathered).
  - UI: radio-style option selection in AskMePanel for medium; click submits.
  - Grading: direct comparison to correct index, no LLM call needed (speed + cost win).
- **P1 — Discover vs random topic.** Split the current "random" mode into two:
  - `random` — picks from user's interests *(current behavior, renamed if needed)*
  - `discover` — Claude picks any topic, unconstrained by interests. Expands the log into new territory.
  - AskMePanel topic dropdown gets "Discover" as a third option alongside specific topics and Random.

**Exit:** No repeat questions on 10 consecutive gens within a topic; medium feels guessable instead of punishing; `discover` surfaces a topic Monte hasn't listed as an interest.

### Phase 5 (queued): UX polish round 2

TBD — more polish items surfacing from Su's testing. Monte will fill this in after Phase 4 ships.

---

## Backlog

**Parked phases** (previously active, deprioritized in favor of UX-first direction):

- **Auth + multi-user writes** — HMAC-signed cookie sessions, `/login`/`/logout`, `POST /api/users/claim`, gate `/api/quiz/*` on session, claim flow UI on `/[user]?invite=XXX`, rate limit 20/user/day. Needed before Su can drive her own account; currently the skill writes for her.
- **Guest flow + homepage demo** — `POST /api/quiz/try` (unauthed, no persist), homepage loads a random Monte question on arrival, "Try your own" → guest API → "create account to save" modal. Turns the homepage into a live demo.
- **Charts + voice + leaderboard** — `/[user]/stats` with Recharts (daily bar, 7-day correct-rate line, topic breakdown), voice input via Web Speech, homepage leaderboard (streak / correct-rate / total), per-user accent color.
- **Image mode + polish** — `medium=image` via nano-banana + Vercel Blob, OG cards per question, spaced repetition (`result=wrong` resurfaces at 3/7/30 days), custom domain.

**Smaller ideas:**

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

- **Dedup scope** — last N questions per topic (topic-scoped) or last N globally? Topic-scoped is more permissive (you can get a Roman question even if one was just asked about pickleball). Gut: topic-scoped.
- **Multiple-choice grading transparency** — when the user picks wrong, show correct answer + optional Ash-written explanation? Adds one LLM call but preserves the "learning from being graded" feeling. Cheap to keep; consider.
- **Discover safety rails** — `discover` picks any topic. Should it skip topics already in the user's list (pure novelty)? Or allow overlap (sometimes surprise you with a pickleball question unprompted)?
- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before first xhard runs.
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate and ask about it?
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set (when auth lands).

---

*Updated: 2026-04-18*
