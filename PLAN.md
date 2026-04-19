# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me). **Phases 1–5 shipped.**

**Stack:** Next.js 16 + Tailwind 4, Neon Postgres (HTTP driver), Anthropic SDK direct (`claude-sonnet-4-6`), Zod validation, Vercel auto-deploy. Emerald-on-black editorial theme (Fraunces serif hero).

**Routes:**
- `/` — marketing landing: rotating hero (two eyebrow+H1 pairs, 5s crossfade), stats row, pillar cards, recap CTA. No inline demo — "Try it now →" sends you to `/monte`.
- `/users` — user cards + join card
- `/[user]` — per-user log: serif name, inline stats, interests, paginated questions, AskMePanel inline
- `/questions` — all questions, difficulty + topic filters, stats reflect filter state
- `/questions/[id]` — question detail with attribution link back to `/[user]`
- `/api/quiz/new` + `/api/quiz/grade` — Zod-validated, parameterized by username

**Landing + chrome (Phase 5):** BrandBar top-left with top-right nav (Play → `/monte`, Users, Questions) on every route. No in-content back links — browser back + top nav cover navigation. `<Hero />` (client, rotating), `<StatsSection />`, `<PillarCards />`, `<RecapCTA />` anchor the landing. BRAND.md is the single source for copy.

**Question mechanics (Phase 4):**
- **Topic-scoped dedup** — last 20 questions on the picked topic passed to Claude with "do not repeat or paraphrase."
- **Multiple choice (easy + medium)** — easy = binary Yes/No, medium = 4 plausible distractors from same category/era. `options jsonb` + `correct_index int` on questions (migration 002). Grading is **instant** (direct index compare, no LLM call); `correctIndex` never leaves the server.
- **Freeform (hard + xhard)** — unchanged; LLM grades with difficulty-specific rubrics.
- **Discover mode** — topic picker has `random` (user's interests), `discover` (Claude picks fresh, excludes interests ∪ all past-quizzed topics), or a specific topic. Discover's picked topic is stored on the row, so the discovery pool keeps shrinking with play.

**AskMePanel UX refresh:** Idle state is now an inline-token sentence — `Quizzing you on [topic ▾] with [difficulty ▾] difficulty.` — with a single **Quiz me →** primary CTA. Tokens open inline dropdowns (topic picker has Random / Discover / Your topics / Recent; difficulty has all four with a one-word hint each). A stats subtitle shows context for the current slice (`X {topic} questions at {diff} · Y% correct ↑`) when ≥3 graded; xhard shows thoughtfulness avg instead of correctness; Discover shows breadth. Last topic + difficulty persist in `localStorage` (`qm-last-topic:<user>`, `qm-last-difficulty:<user>`).

**Shared infra:** `<QuestionList />`, `<Pagination />`, `<BrandBar />`, `<SiteFooter />`, 308 redirect `/:user/q/:id → /questions/:id`.

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

### Phase 6 (active): `/play` guest mode + soft login

Landing is marketing. `/play` is the product surface. Give strangers a 5-question trial without an account; give claimed users a one-click entry that writes to their log.

**Design decisions (locked up front):**

| Decision | Choice |
|---|---|
| Guest difficulty | **Medium only** (4-choice MC). Instant grade, no second LLM call. Cheap + fast for trial. |
| Guest topics | **Curated 6-grid** (Roman history, pickleball, jazz, space exploration, AI, cooking) + free-text input for custom. |
| Guest question API | `POST /api/quiz/try` — stateless. Returns `{ question, options, correctIndex, answerKey }` (correctIndex leaks on guest path; acceptable because no persistence). |
| Guest counter | `localStorage: qm-trial-count` (0–5). Soft limit — bypass cost is low, real cap is Claude $. |
| Guest dedup | `localStorage: qm-trial-topics[]` — the questions already shown this trial, passed to Claude as exclude list. |
| Soft-login cookie | `qm-user=<username>`, 1 year, client-readable. Set via `?claim=<inviteCode>` on `/[user]` (user proves identity via invite code, no password yet). |
| Claim CTA (end of trial) | Mailto invite for now (same as landing "Ask for an invite"). Self-serve signup is parked — ships with real auth. |
| Phase 6 does NOT ship auth | No passwords, no HMAC sessions. Cookie is trust-based for Monte + Su. Full auth is a separate parked phase when third user lands. |

**Scope:**

1. **New route `/play`** — server component, reads `qm-user` cookie
   - Cookie + user exists → render AskMePanel defaulting to that account (current `/monte` behavior, moved here)
   - No cookie → render `<GuestPlay>` component (new)

2. **`<GuestPlay>` component** (new, client)
   - Header: "You're in guest mode. Here's 5 questions on us."
   - Counter chip: `2 / 5`
   - Topic picker: 6-card curated grid + "or type a topic:" input
   - Question flow: pick topic → see MC question → answer → see grade + answer key → "Next question →"
   - After 5th answer: panel replaces with claim banner — "Hope you had fun. Want your own log? [Ask for an invite →]"

3. **`POST /api/quiz/try`** (new API route)
   - Body: Zod-validated `{ topic: string, prior: string[] }`
   - Reuses existing `generationPrompt` with MC-medium schema
   - Returns question + options + correctIndex + answerKey to client
   - No DB writes, no user association

4. **Claim-by-invite on `/[user]`** (soft login)
   - New query param `?claim=<inviteCode>`
   - If `inviteCode` matches the user's invite, set `qm-user=<username>` cookie + redirect to `/play`
   - Invalid code → show normal user page with a small "Invalid code" toast
   - This replaces the unbuilt claim UI stub for now

5. **CTA flip on landing**
   - Hero + RecapCTA `Try it now →`: `/monte` → `/play`
   - BrandBar nav `Play`: `/monte` → `/play`
   - BRAND.md Copy-by-page updated

6. **Monte + Su bootstrap**
   - Monte visits `/monte?claim=<his-code>` once → cookie set → all future `/play` visits write to his log
   - Su can do the same with `SU-CC23CA` when she's ready

**What already landed (pulled forward from Phase 5):**
- AskMePanel removed from landing ✅
- CTAs live on the landing pointing to a real surface (currently `/monte`) ✅
- Top-nav Play link in place ✅

**Exit:** Stranger lands on `/` → clicks Try it now → `/play` → gets 5 MC questions on curated topics → hits claim banner with invite CTA. Monte/Su click Play → cookie recognizes them → land on AskMePanel with their topics loaded, writes to their log.

**Rough size:** 4–6 hours. One new route, one new component, one new API route, one `?claim=` handler, three CTA repoints.

### Phase 7 (queued): Charts

Cash in the subhead promise ("Charts that track your progress").

**Scope:**
- **Where they live**: `/[user]/stats` or a tab on `/[user]`. Possibly mirrored on `/play` for guest-session stats.
- **Three charts** (Recharts):
  1. Daily activity bar — questions asked per day, last 30 days
  2. Correct rate line — rolling 7-day %
  3. Topic breakdown — horizontal bars or pie, questions per topic
- **Data**: existing `questions` columns (`created_at`, `result`, `topic`, `difficulty`) — no schema changes needed.
- **Empty states**: first-day-playing copy that doesn't feel broken.

**Flesh out later:** correct-rate by difficulty, streak visualization, topic mastery heatmap.

---

## Backlog

**Skill coherence gap** — `ash-core/skills/quiz-me/SKILL.md` writes freeform questions to `users.json`; the web UI now generates MC for easy/medium. Skill should emit `options` + `correctIndex` for easy/medium so skill-written and web-written questions have the same shape.

**Parked phases** (adjacent to current direction, not actively scheduled):

- **Auth + multi-user writes** — HMAC-signed cookie sessions, `/login`/`/logout`, `POST /api/users/claim`, gate `/api/quiz/*` on session, claim flow UI on `/[user]?invite=XXX`, rate limit 20/user/day. Phase 6's soft-login cookie is the cheap precursor; full auth lands when Su or a third user needs private writes.
- **Telegram / SMS reminders** — Monte's reminder want. Daily nudge with one question, or weekly digest. Likely leverages ash-core reminders infra.
- **Voice + leaderboard + per-user accent** — voice input via Web Speech, homepage leaderboard, per-user accent color.
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
