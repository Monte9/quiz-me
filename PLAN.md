# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me). **Phase 1 + Phase 2 shipped 2026-04-17.** Phase 3 (foundation cleanup) is next.

**Phase 1 — shipped:**
- Next.js 16 + Tailwind 4, Vercel auto-deploy, emerald-on-black editorial theme (Fraunces serif hero, number-forward stat blocks)
- Pages: `/`, `/users`, `/[user]` (dashboard or claim-stub), `/[user]/q/[id]`
- 2 users seeded (Monte claimed, Suvarcha unclaimed with invite `SU-CC23CA`), 11 interests, 1 real quiz
- Writer skill at [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — writes `users.json` + commits

**Phase 2 — shipped:**
- Neon Postgres foundation: `users`/`questions` tables + index, `src/lib/db.ts`, `pnpm db:migrate` + `db:seed`, seeded from `users.json`
- Read path on Postgres: dropped `output: "export"`, server-mode deploy, `src/lib/users.ts` reads from DB
- API routes: `POST /api/quiz/new` + `POST /api/quiz/grade` live on Vercel, `src/lib/claude.ts` + `src/lib/prompts.ts` + `src/lib/quiz.ts`
- `<AskMePanel />` + Zod hardening. Homepage: AskMePanel as primary CTA under hero, 3 most recent questions below. Yes/No buttons for easy. `callJSON<T>` schema-validates Claude output. Polish: top-aligned panel, shimmer loading skeleton, consistent card width, result pill next to "Your answer."
- Dual-write dropped — skill keeps manual `users.json` commits; Postgres is the runtime DB; `db:seed` rebuilds from JSON on demand.

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage | **Neon Postgres** (runtime truth); `users.json` remains seed + version-controlled snapshot |
| 2 | Auth | Plain-text password, signed-cookie session (HMAC, no library). Deferred to Phase 4. |
| 3 | Invite flow | Invite code generated + committed by skill; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = landing + Monte's log; `/users` = all users; `/[user]` = per-user |
| 5 | Public vs private | All browsing public. Ask/answer/claim requires session (Phase 4+). |
| 6 | Claude API | Serverless only; `ANTHROPIC_API_KEY` in Vercel env; never client-side |
| 7 | Voice | Phase 6 via Web Speech API. v1 = text + Y/N buttons. |
| 8 | Rate limit | 20 quizzes/user/day (added in Phase 4 with auth) |
| 9 | Skill writes | Skill commits to `users.json` only. Postgres is the runtime DB; `db:seed` rebuilds from `users.json` when needed. No dual-write. |
| 10 | LLM SDK | `@anthropic-ai/sdk` direct. Vercel AI SDK skipped — overkill for two `messages.create` calls, no streaming/tools. |
| 11 | Validation | **Zod** for API bodies + Claude output schemas (folded into Step 4) |

---

## Phases

### Phase 3 (active): Foundation cleanup — routes, shared components, de-monte-ification

Goal: make the app feel like one cohesive site (not three). Burn out hardcoded `"monte"` strings so auth lands cleanly in Phase 4.

**Routes:**
- **New `/questions`** — full list of all questions, newest first. Click a card → `/[user]/q/[id]` (today's behavior); **add prev/next nav on the detail page** so you can browse fast. Filter row: difficulty pills + topic dropdown.
- **`/` (homepage)** — move the 3 stats from `/users` onto homepage as linked tiles: `USERS` → `/users`, `QUESTIONS` → `/questions`, `TOPICS` → future. "See all" under Recent Questions now points to `/questions` (not `/users`).
- **`/users`** — strip stats block; just user cards + join card.
- **`/[user]`** — unify layout with the unclaimed stub aesthetic: centered serif name, status pill above, supporting content below. Drop the dense `StatBar` + `InterestChips` header. AskMePanel rendered if the user is you (parameterized by `username` prop, not hardcoded). Thin stats row below questions. Interests as subtle chips under the name.

**Shared components / structure:**
- **`<QuestionList />`** — one component for homepage recent, `/questions`, and `/[user]` question log. One collapse behavior, one look.
- **Persistent footer nav** — `SiteFooter` picks up `Home / Users / Questions` links. BrandBar stays minimal.
- **BrandBar tighter** on non-home pages (or drop on `/[user]` since the user's name is the identity).

**De-monte-ification:**
- Remove `const USERNAME = "monte"` from `/api/quiz/new` + `/api/quiz/grade` — take `username` in request body.
- Homepage no longer imports `getUser("monte")` directly; AskMePanel takes `username` prop.
- `UserDashboard` gates AskMePanel on a single check (still monte-only in v1, but the plumbing is ready for auth).

**Exit:** `/monte` and `/suvarcha` share the same layout shell. `/questions` is a real browsing surface. Hardcoded `"monte"` is gone from 4 spots. Auth can land on top.

### Phase 4: Auth + multi-user writes

- `POST /api/users/claim`, `/login`, `/logout`; HMAC-signed cookie sessions, middleware attaches `user`
- Gate `/api/quiz/*` on session
- Claim flow UI on `/[user]?invite=XXX`
- Rate limit: 20/user/day in Postgres
- Suvarcha claims, asks her first question

### Phase 5: Guest flow + homepage live demo

- `POST /api/quiz/try` (unauthed) — generate + grade using Monte's interests, don't persist
- Homepage: on load pick a random Monte question → reveal pattern; "Try your own" → guest API → modal "Create an account to save this"

### Phase 6: Charts + voice + leaderboard

- `/[user]/stats` — Recharts: daily bar (stacked by difficulty), 7-day correct-rate line, topic breakdown, stat tiles
- Voice input via Web Speech API
- Homepage leaderboard: streak / correct-rate / total
- Per-user custom accent color

### Phase 7: Image mode + polish

- `/api/quiz/new` handles `medium=image` via `nano-banana`; Vercel Blob for storage
- OG cards per question
- Spaced repetition: `result=wrong` resurface at 3/7/30 days
- Custom domain (`quizme.xyz`?)

---

## Backlog

- **Topic display names** — add `displayName` field to interests JSON entries; UI falls back to title-cased slug when missing. Cosmetic polish; not blocking anything.
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
- **Image-response questions** — for `medium=image`, does the user upload a drawing/photo, or does Ash generate and ask about it? Decide before Phase 7.
- **Suvarcha's interests** — claim flow asks for 3–5 interests right after password set.

---

*Updated: 2026-04-17*
