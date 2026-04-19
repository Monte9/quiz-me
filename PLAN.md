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

### Phase 5 (active): Landing page redesign

Now that the product mechanics are solid, make the landing page pull its weight as a marketing surface. Informed by [BRAND.md](./BRAND.md) (two ICPs, three pillars, rotating taglines). Spec: [specs/phase-5-landing.md](./specs/phase-5-landing.md) *(to be written)*.

**Scope:**
- **BrandBar moves to top-left** (was centered). Classic marketing-site anchor.
- **Paired rotating eyebrow + H1.** Eyebrow swaps with the H1 as a unit. `For trivia nerds` ↔ `Trivia that knows what you love.` / `For curious minds` ↔ `Master the topics that matter to you.` 5s cadence, 500ms crossfade.
- **Primary CTA button in hero**: `Try it now →`. In Phase 5 it anchors to the AskMePanel below (smooth scroll). In Phase 6 it switches to `/play`.
- **Stats section** broken out of the tile row — bigger typography, own section, micro-captions under each number.
- **Three pillar cards**: Personalized / Challenging / Tracked. One card per pillar, plain-language body copy from BRAND.md.
- **Recap + CTA section** at the bottom: "Ready to get started?" with "Try it now →" + "Ask for an invite" buttons, plus two sub-cards linking to `/questions` and `/users`.
- **AskMePanel stays on the landing** for Phase 5 (it's the inline demo the top CTA scrolls to). Moves to `/play` in Phase 6.
- **BRAND.md "Copy by page" section** stays in sync as copy changes.

**Exit:** Landing scroll is a coherent marketing narrative (hero → stats → pillars → demo → proof → CTA). Every piece of copy traces to BRAND.md. Both ICPs (Su + Monte) feel spoken to.

### Phase 6 (queued): `/play` guest mode + soft login

Spin the demo out of the landing page into its own product surface with guest-mode trial.

**Scope:**
- **New route `/play`** — dedicated quiz playground.
- **Guest trial**: 5 free questions, no account needed. Counter visible (`1/5`, `2/5`, …). After 5, claim banner: "Want to keep your log? Claim your username →" → invite flow (or future self-serve signup).
- **Soft-login cookie**: when a visitor has a known username stored in cookie, `/play` defaults to that account and writes to their log (no full auth yet — this is a personal-use cookie, upgradeable to HMAC-signed session later).
- **`POST /api/quiz/try`** — guest variant of `/quiz/new`, no DB writes, ephemeral.
- **Landing CTA flip**: hero + bottom "Try it now" buttons switch from `#ask` anchor to `/play`. AskMePanel removed from landing.
- **Topic source for guests**: curated set of sample topics (e.g. Roman history, pickleball, jazz, space) so guests don't have to configure anything.

**Exit:** Visitor lands on `/` → clicks "Try it now" → lands on `/play` → answers up to 5 questions as guest → hits claim CTA. Monte lands on `/play` → cookie recognizes him → AskMePanel defaults to his account.

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
