# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [monte9/quiz-me](https://github.com/monte9/quiz-me). **Phases 1–5 shipped.**

**Stack:** Next.js 16 + Tailwind 4, Neon Postgres (HTTP driver), Anthropic SDK direct, Zod validation, Vercel auto-deploy. Emerald-on-black editorial theme (Fraunces serif hero). Four migrations applied; CI (GitHub Actions, `db-migrate.yml`) re-runs on push when `migrations/**` or `scripts/migrate.ts` changes.

**Routes:** `/` marketing landing (rotating hero, stats, pillars, recap CTA) · `/users` · `/[user]` per-user log with AskMePanel inline · `/questions` (filterable) · `/questions/[id]` detail · `POST /api/quiz/new` + `/api/quiz/grade`.

**AskMePanel:** inline-token sentence — `Quizzing you on [topic ▾] with [difficulty ▾] difficulty.` — single **Quiz me →** CTA. Tokens open inline pickers (Random / Discover / Your topics / Recent for topic; four difficulties with one-word hint + tier chip). Mobile: bottom-sheet pickers. Context stats subtitle (`X {topic} questions at {diff} · Y% correct ↑`) kicks in at ≥3 graded. Last topic+difficulty persist in `localStorage`. Tinted answer card on reveal. Pure helpers live in `@/lib/quiz-core` so the client bundle has no DB import.

**Question mechanics (Phase 4):**
- **Topic-scoped dedup** — last 20 questions on the picked topic passed to Claude with "do not repeat or paraphrase."
- **Multiple choice (easy + medium)** — easy = binary Yes/No, medium = 4 plausible distractors. Grading is instant (index compare, no LLM); `correctIndex` never leaves the server. No Skip button (MC is low-friction).
- **Freeform (hard + xhard)** — LLM grades with difficulty-specific rubrics; reference answer shown alongside grade (not prefilled). Skip still calls the LLM to produce a reference so the user learns.
- **xhard structured format** — questions render as context paragraph(s) → Your task callout → Constraints bullet list (via `<QuestionBody />`), parsed from LLM output with defensive section reorder. Recent cards clamp to 6 lines with preview-text stripped of structural markers; click-through to detail for full.
- **Discover mode** — topic picker has `random` (user's interests), `discover` (Claude picks fresh, excludes interests ∪ all past-quizzed topics), or a specific topic. Discover's picked topic is stored on the row.

**Model tiering (per question):** `easy/medium → Haiku`, `hard → Sonnet`, `xhard → Opus`. Tier chip shown next to difficulty picker + on question cards + on detail page. `model` column on `questions` (migration 004). IDs mapped in `@/lib/claude` (server) with client-safe tier label in `@/lib/quiz-core`.

**User page:** simpler header, leaderboard rank badge, interests, paginated questions. `/questions` supports user filter.

**Shared infra:** `<QuestionList />`, `<Pagination />`, `<BrandBar />`, `<SiteFooter />`, `<QuestionBody />`, 308 redirect `/:user/q/:id → /questions/:id`.

**Data:** `users` + `questions` tables, seeded from `users.json`. 2 users (Monte claimed, Suvarcha unclaimed with invite `SU-CC23CA`). Skill at [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) writes `users.json` + commits; `pnpm db:seed` rebuilds Postgres on demand.

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
| 15 | Model tiering | Haiku (easy/medium), Sonnet (hard), Opus (xhard). Stored per question. |
| 16 | Migrations | Idempotent SQL; CI runs `pnpm db:migrate` on push when migrations change. |

---

## Phases

### Phase 6 (active): `/play` guest mode + soft login

Landing is marketing. `/play` becomes the product surface. Strangers get a 5-question MC trial without an account; claimed users get a one-click entry that writes to their log.

**Shape:**
- New route `/play`, reads `qm-user` cookie. Cookie + user → current AskMePanel. No cookie → `<GuestPlay>` (curated 6-topic grid + free-text; 5 medium-MC questions; counter in `localStorage`).
- New `POST /api/quiz/try` — stateless, returns `{ question, options, correctIndex, answerKey }`, no DB writes.
- Soft-login: `/[user]?claim=<inviteCode>` sets `qm-user` cookie (1yr, client-readable). No passwords yet — full auth is a separate parked phase when a third user lands.
- Flip landing CTAs + BrandBar Play link from `/monte` → `/play`.
- Monte + Su bootstrap via their invite codes.

**Exit:** Stranger → `/play` → 5 MC questions → claim banner. Monte/Su click Play → cookie → AskMePanel on their log.

**Size:** 4–6 hours. Full scope lives in a spec when work starts.

### Phase 7 (queued): Charts

Cash in the subhead promise. `/[user]/stats` or a tab. Three Recharts: daily activity bar, rolling correct-rate line, topic breakdown. Data already in `questions` (no schema change). Empty states for day-1 users.

---

## Backlog

**Skill coherence gap** — `ash-core/skills/quiz-me/SKILL.md` writes freeform questions to `users.json`; the web UI now generates MC for easy/medium + stores `model`. Skill should emit `options`, `correctIndex`, and `model` so skill-written and web-written questions have the same shape.

**Parked phases:**
- **Auth + multi-user writes** — HMAC-signed cookie sessions, `/login`/`/logout`, `POST /api/users/claim`, gate `/api/quiz/*` on session, claim UI, 20/day rate limit. Phase 6 soft-login is the cheap precursor.
- **Telegram / SMS reminders** — daily nudge with one question, or weekly digest. Leverages ash-core reminders infra.
- **Voice + leaderboard + per-user accent** — voice input via Web Speech, richer leaderboard, per-user accent.
- **Image mode + polish** — `medium=image` via nano-banana + Vercel Blob, OG cards, spaced repetition, custom domain.

**Smaller ideas:** prev/next nav on question detail · topic display names · MC wrong-answer one-liner explanation · shared "question of the day" · admin panel for invites · topic hierarchy (`history/roman`) · session mode (batch of 5) · export wrong answers to Anki · per-topic difficulty auto-calibration · bcrypt once >2 users · shareable OG grade cards · weekly recap email.

---

## Open Questions

- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before the first skill-written xhard runs.
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate an image and ask about it?
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set (when auth lands).

---

*Updated: 2026-04-24*
