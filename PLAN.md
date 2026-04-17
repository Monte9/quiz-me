# Quiz Me — Plan

A public trivia-log where an AI (Ash) quizzes you on topics you pick, grades honestly, and keeps a running portfolio of what you know. Multi-user, invite-only.

---

## Vision

The product for people who love trivia but want something smarter than flashcards. Pick your topics, pick your difficulty, get asked a question you've never seen before, get graded honestly. Every answer becomes part of your public quiz log — a growing, shareable portfolio of what you've been tested on and how you did.

Four difficulty tiers stretch it from casual (easy = yes/no) to serious (xhard = propose a solution to an unsolved problem). The site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

- Live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)** — repo [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me)
- Next.js 16 + Tailwind 4, static export, auto-deploys on push
- `users.json` in repo is the source of truth (schema: `users.<username>.{displayName, claimedAt, password, inviteCode, interests, questions}`)
- **Pages:** `/` (landing hero + Monte's log), `/users` (all users + join card), `/[user]` (per-user dashboard or claim-stub), `/[user]/q/[id]` (question detail)
- **UI:** emerald-on-black editorial theme, Fraunces serif hero, number-forward stat blocks, "how it works" 3-step cards, cursor-stats-style radial glow
- **Data:** 2 users seeded (Monte claimed, Suvarcha unclaimed with invite code `SU-CC23CA`), 1 real quiz answered (skipped porsche-cars), 11 interests
- **Writer skill:** [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — reads/writes `users.json` under `users.monte.*`, commits + pushes
- **Not yet:** any backend, any auth, any way for users to interact with the site beyond browsing

---

## The Big Shift (Phase 2)

The site is a gorgeous static log, but it's read-only. Every interactive idea on this page — sign-up, web-triggered quiz, live demo, interactive answers, sessions — requires a real backend. Phase 2 is that pivot.

- Drop `output: "export"` → Next.js server-mode on Vercel (still free)
- Add Vercel KV (or Turso) as runtime database; `users.json` becomes a seed, KV is truth
- Serverless API routes for quiz generation (Claude API), grading, claim, login
- HMAC-signed cookie sessions for auth
- Plain-text passwords for v1 (bcrypt when this grows beyond Monte + Su)

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage model | `users.json` in repo (seed) + Vercel KV (runtime truth) |
| 2 | Auth | Plain-text password, signed-cookie session (HMAC, no library) |
| 3 | Invite flow | Invite code generated + committed by skill; shared out-of-band; URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = landing + Monte's log (canonical demo); `/users` = all users; `/[user]` = per-user |
| 5 | Public vs private | All browsing public. Ask/answer/claim requires session. |
| 6 | Claude API | Called from serverless; `ANTHROPIC_API_KEY` in Vercel env; never client-side |
| 7 | Voice | Phase 3 via Web Speech API (browser-native). v1 = text + Y/N buttons. |
| 8 | Rate limit | 20 quizzes/user/day in KV |

---

## Data Model

### `users.json` (seed, committed)

```json
{
  "users": {
    "monte": {
      "displayName": "Monte",
      "createdAt": "...",
      "claimedAt": "...",
      "password": "<plaintext for v1>",
      "inviteCode": null,
      "interests": [{ "name": "roman-history", "addedAt": "..." }],
      "questions": [ /* entries */ ]
    },
    "suvarcha": {
      "displayName": "Suvarcha",
      "claimedAt": null,
      "password": null,
      "inviteCode": "SU-CC23CA",
      "interests": [],
      "questions": []
    }
  }
}
```

At deploy time, if KV is empty, import from `users.json`. Skill continues to write `users.json` (for version-controlled snapshots) and mirrors into KV.

### Per-question shape — unchanged

`id`, `difficulty`, `medium`, `topic`, `question`, `answerKey`, `userAnswer`, `result`, `thoughtfulnessScore`, `imagePath`, `grade`, `createdAt`.

---

## Phases

### Phase 2 (next): Backend foundation — auth, API, live demo

**This unlocks everything interactive. Ships Su's first real quiz AND the homepage demo.**

- Remove `output: "export"`; keep ISR/static generation for public pages
- Add Vercel KV; seed from `users.json` on first deploy
- Auth:
  - `POST /api/users/claim` — invite + password → claim + `claimedAt`
  - `POST /api/users/login` — username + password → signed cookie
  - `POST /api/users/logout`
  - Middleware attaches `user` to request
- Quiz API:
  - `POST /api/quiz/new` (authed) — `{ difficulty?, medium?, topic? }` → Claude call → `{ questionId, question, … }`. Answer key held server-side against `questionId` with 10-min TTL.
  - `POST /api/quiz/grade` (authed) — `{ questionId, userAnswer }` → Claude grades → persist to KV → return grade
  - `POST /api/quiz/try` (unauthed) — guest flow for homepage demo: generate + grade a sample question using a default profile (Monte's interests), *don't* persist. Return grade but gate "save to your log" behind sign-up.
- **Homepage live demo** (the interactive sell):
  - On first load, pick a random question from Monte's log → show it → input box → "See how Monte answered" reveals his answer + Ash's grade + answer key. Pure client-side, no LLM call, uses real data.
  - Secondary: "Try your own" → guest-mode API generates a fresh question → user answers → grade → modal: "Create an account to save this result"
- Session detection in browser: on claim, store `sessionToken` cookie. If set + valid, show "Ask me a question" button on `/[user]`.
- Claim flow UI on `/[user]?invite=XXX`: set password → session → redirect to their dashboard
- Rate limit: 20/user/day in KV

**Exit:** Monte texts Su the invite URL, she claims, she asks a question, she answers, it shows up on her page. Any visitor lands on `/`, sees a real question, answers it, and gets funneled to sign up.

### Phase 3: Charts + voice + leaderboard

- `/[user]/stats` — Recharts: daily bar (stacked by difficulty), 7-day correct-rate line, topic breakdown, stat tiles (streak, longest, most-missed, avg xhard)
- Voice input via Web Speech API
- Homepage leaderboard: all users ranked by streak / correct-rate / total
- Per-user custom accent color

### Phase 4: Image mode + polish

- `/api/quiz/new` handles `medium=image` via `nano-banana` or JS SDK; Vercel Blob for storage
- OG cards per question
- Spaced repetition: `result=wrong` resurface at 3/7/30 days
- Weekly digest (Slack/email)
- Custom domain (`quizme.xyz`?)

---

## Backlog

- **Live interactive demo on homepage** (folded into Phase 2)
- **`/users` page** — ✅ shipped
- **Shared questions** — "question of the day" seen by all users; compare answers
- **Admin panel** — Monte generates invites from the web UI (skill-only today)
- **Topic hierarchy** — `history/roman`, `ai/transformers`
- **Session mode** — "quiz me 5 hard" → batch of 5
- **Export wrong answers to Anki**
- **Difficulty auto-calibration per topic** — Ash notices you're crushing `medium indian-mythology` and bumps to `hard`
- **Bcrypt passwords** once > 2 users
- **Invite-code resend** if lost
- **Shareable grade cards** — OG image per answered question for social posts
- **Weekly recap email** — streak, correct-rate, top-missed topic

---

## Open Questions

- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before first xhard runs.
- **Skill writes: direct KV vs via API?** Direct = faster; API = single write path. Recommend: skill gets a `SKILL_TOKEN` unlocking direct KV writes so both paths work.
- **Difficulty/medium picker UX** — dropdown or preset "Ask me" button? Recommend: default button + small settings disclosure.
- **Suvarcha's interests** — Monte seeds them or she picks on claim? Recommend: claim flow asks for 3–5 interests right after password set.
- **Guest demo persistence** — should guests get a temporary local-storage log of their tries until they sign up? Tradeoff: retention vs complexity.

---

*Updated: 2026-04-17*
