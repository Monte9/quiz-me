# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

**Phase 1 shipped (2026-04-17)** — multi-user data model, editorial UI, `/users` page, Monte's log live as the canonical demo. Static only, no backend yet.

- Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me)
- Next.js 16 + Tailwind 4, static export, auto-deploys on push
- `users.json` in repo is the source of truth (schema: `users.<username>.{displayName, claimedAt, password, inviteCode, interests, questions}`)
- **Pages:** `/` (landing hero + Monte's log), `/users` (all users + join card), `/[user]` (per-user dashboard or claim-stub), `/[user]/q/[id]` (question detail)
- **UI:** emerald-on-black editorial theme, Fraunces serif hero, number-forward stat blocks, "how it works" 3-step cards, cursor-stats-style radial glow
- **Data:** 2 users seeded (Monte claimed, Suvarcha unclaimed with invite code `SU-CC23CA`), 1 real quiz answered, 11 interests
- **Writer skill:** [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — reads/writes `users.json` under `users.monte.*`, commits + pushes

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
| 9 | Skill writes | Dual-write: `users.json` (commit) AND Postgres (via direct connection or API) |

---

## Phases

### Phase 2.0 (next): Web quiz flow — Monte only, no auth

Build the hardest part (Claude-powered quiz loop in the browser) in the simplest context: one hardcoded user. Layer auth on after it works.

**Spec:** [specs/phase-2-backend.md](specs/phase-2-backend.md)

**Monte sets up:**
- Neon project `quiz-me` (free tier)
- Vercel env: `DATABASE_URL`, `ANTHROPIC_API_KEY`

**Build:**
- Drop `output: "export"` → Next.js server-mode on Vercel
- Add `@neondatabase/serverless`, schema migration, seed from `users.json`
- `POST /api/quiz/new` — Claude generates question → persists `pending` row → returns `{ questionId, question }`
- `POST /api/quiz/grade` — Claude grades → updates row → returns grade
- UI: "Ask me a question" button on `/` + `/monte` → difficulty/topic picker → input → reveal answer + grade
- Skill keeps writing `users.json` + commits (unchanged), also writes to Postgres

**Exit:** You land on quizmenexus.vercel.app, click "Ask me medium", Claude asks a real question, you answer, see Ash's grade, refresh — it's in your log.

### Phase 2.1: Auth + multi-user writes

- `POST /api/users/claim`, `/login`, `/logout`
- HMAC-signed cookie sessions; middleware attaches `user`
- Gate `/api/quiz/*` on session
- Claim flow UI on `/[user]?invite=XXX`
- Rate limit: 20/user/day in Postgres
- Suvarcha claims, asks her first question

### Phase 2.2: Guest flow + homepage live demo

- `POST /api/quiz/try` (unauthed) — generate + grade using Monte's interests, don't persist
- Homepage: on load, pick a random Monte question → reveal pattern; "Try your own" → guest API → modal "Create an account to save this"

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
- **Skill writes: direct Postgres vs via API?** Direct = faster; API = single write path. Recommend: skill gets `DATABASE_URL` in local env and writes direct; API handles web writes.
- **Difficulty/medium picker UX** — dropdown or preset "Ask me" buttons? Recommend: three default buttons (easy/medium/hard) + settings disclosure for topic/xhard.
- **Suvarcha's interests** — Monte seeds them or she picks on claim? Recommend: claim flow asks for 3–5 interests right after password set.

---

*Updated: 2026-04-17*
