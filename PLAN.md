# Quiz Me — Plan

Daily quizzes, persisted over time, visualized on a live site. Multi-user: Monte uses Ash via terminal, everyone else uses the web app. Built on the history-stories pattern, extended with auth + API.

---

## Vision

A quiz habit that compounds — for Monte, Su, and anyone they invite. Ash asks questions across difficulties (easy/medium/hard/xhard) and mediums (text/image). Every answered question is persisted. Each user has a public profile at `/[user]` with interests, stats, charts, and a question log. Only the account owner can ask + answer questions (password-locked). Over time the site becomes a shared map of what each person has learned — and what they keep getting wrong.

---

## Current State

- Repo: [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me) (private), live at **[quizmenexus.vercel.app](https://quizmenexus.vercel.app)**
- Next.js 16 + Tailwind 4, static export, auto-deploys on push
- `history.json` at repo root: single-user (`interests` + `questions`), 11 interests seeded + 1 real quiz (medium porsche-cars — skipped)
- Browse grid on `/`, detail page on `/q/[id]`, saffron-gold accent
- Writer skill: [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — writes + commits + pushes
- **Not yet:** multi-user, auth, browser-based quizzing, charts

---

## The Big Shift

Phase 2 changes the architecture. Currently: static export, git = database, skill-only writer. Going forward:

- Drop `output: "export"` → Next.js server-mode on Vercel (still free, still auto-deploys)
- Add Vercel KV (or Turso) as the runtime database — fast reads, writable from serverless functions
- `users.json` in the repo becomes a seed/snapshot; KV is the runtime truth
- Serverless API routes for quiz generation (Claude API), grading, claim, login
- Plain-text passwords for v1 (bcrypt when this grows beyond Monte + Su)

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Storage model | `users.json` in repo (seed) + Vercel KV (runtime truth) |
| 2 | Auth | Plain-text password, signed-cookie session (HMAC, no library) |
| 3 | Invite flow | Invite code generated + committed by skill; shared out-of-band (text/Slack); URL `/[user]?invite=<code>` |
| 4 | Routing | `/` = Monte's dashboard (default) + user switcher; `/[user]` = that user's dashboard |
| 5 | Public vs private | All stats public. Ask/answer/claim requires session. |
| 6 | Claude API | Called from serverless; `ANTHROPIC_API_KEY` in Vercel env; never exposed client-side |
| 7 | Voice | Phase 3 via Web Speech API (browser-native, free). v1 is text + Y/N buttons only. |
| 8 | Rate limit | 20 quizzes/user/day in KV (stops accidental loops + cost runaway) |

---

## Data Model

### `users.json` (seed, committed)

```json
{
  "users": {
    "monte": {
      "displayName": "Monte",
      "createdAt": "2026-04-17T...",
      "claimedAt": "2026-04-17T...",
      "password": "<plaintext for v1>",
      "inviteCode": null,
      "interests": [{ "name": "roman-history", "addedAt": "..." }],
      "questions": [ /* existing entries */ ]
    },
    "suvarcha": {
      "displayName": "Suvarcha",
      "createdAt": "...",
      "claimedAt": null,
      "password": null,
      "inviteCode": "SU-XXXX",
      "interests": [],
      "questions": []
    }
  }
}
```

- At deploy time, if KV is empty, import from `users.json`.
- Skill continues to write `users.json` AND mirror into KV (or the skill hits the API directly — TBD during Phase 2).

### Per-question shape — unchanged

`id`, `difficulty`, `medium`, `topic`, `question`, `answerKey`, `userAnswer`, `result`, `thoughtfulnessScore`, `imagePath`, `grade`, `createdAt`.

---

## Phases

### Phase 1 (active): Monte's dashboard polish + multi-user data model

**Still static. No backend changes yet. Prep for Phase 2.**

- Refactor `history.json` → `users.json` with `{ users: { monte: {...}, suvarcha: <stub> } }`
- Update SKILL.md: skill writes under `users.monte.*` by default
- Homepage (`/`): Monte's dashboard with:
  - Interests chips row
  - Richer stat bar: total, correct-rate, streak, most-asked topic
  - Questions grid (existing)
  - User switcher row at top: Monte (active) + Suvarcha (link to `/suvarcha`)
- `/[user]` route (static per-user): same layout, different data source
- `/suvarcha` shows a "Not claimed yet" banner (Phase 2 enables claiming)
- Seed Suvarcha as unclaimed user with invite code `SU-XXXX`
- **Exit:** Monte's homepage feels useful, Su's page exists as a stub, data model is multi-user

### Phase 2: Browser-based quiz flow + claim/auth

**The big one. Ships Su's first real quiz.**

- Remove `output: "export"` from `next.config.ts`
- Add Vercel KV; seed from `users.json` on first deploy
- Auth system:
  - `POST /api/users/claim` — invite code + new password → claim account, mark `claimedAt`
  - `POST /api/users/login` — username + password → signed cookie session (HMAC-SHA256 with `SESSION_SECRET`)
  - `POST /api/users/logout`
  - Middleware reads cookie → attaches `user` to request
- Quiz API:
  - `POST /api/quiz/new` (authed) — body: `{ difficulty?, medium?, topic? }` → calls Claude, returns `{ questionId, question, difficulty, medium, topic }`. Answer key held server-side against the questionId with 10-min TTL.
  - `POST /api/quiz/grade` (authed) — body: `{ questionId, userAnswer }` → calls Claude with answer key, persists result to KV, returns grade.
- UI changes on `/[user]`:
  - **Unclaimed + no code:** "This page is not claimed yet. Enter invite code to claim it."
  - **Unclaimed + code in URL** (`?invite=SU-XXXX`): "Welcome, Suvarcha. Set a password to claim."
  - **Claimed + not logged in as this user:** read-only view
  - **Claimed + logged in as this user:** "Ask me a question" button → difficulty/topic picker → question card → answer input (Y/N buttons for easy, text for medium/hard/xhard) → grade reveal
- Rate limit: 20 quizzes/user/day in KV
- **Exit:** Monte texts Su `quizmenexus.vercel.app/suvarcha?invite=SU-XXXX`; she claims; she asks a question; she answers; she sees it on her page

### Phase 3: Charts + voice + leaderboard

- `/[user]/stats` page: Recharts bar (daily, stacked by difficulty), line (7-day correct-rate), horizontal bar (topic breakdown), stat tiles (streak, longest, most-missed topic, avg xhard score)
- Voice input via Web Speech API — button in answer UI, Chrome/Safari native support
- Homepage leaderboard: all users ranked by streak / total / correct-rate
- Per-user custom accent color

### Phase 4: Image mode + polish

- `/api/quiz/new` handles `medium=image`: calls `nano-banana` from the serverless side (uv-on-Vercel or move to JS SDK), stores image in Vercel Blob
- OG cards per question
- Spaced repetition: questions with `result=wrong` re-surface at 3 / 7 / 30 days
- Weekly digest email/Slack
- Custom domain

---

## Backlog

- Bcrypt passwords once > 2 users
- Topic hierarchy (`history/roman`, `ai/transformers`)
- Session mode: "quiz me 5 hard" → batch of 5
- Export wrong answers to Anki
- Difficulty auto-calibration per topic
- Admin panel: Monte creates invites from the web UI (currently skill-only)
- Shared questions: "question of the day" seen by all users
- Invite-code resend if lost

---

## Open Questions

- **xhard thoughtfulness rubric** — what separates 3 from 4 from 5? Short scoring guide needed in SKILL.md before first xhard runs.
- **Should the skill write directly to KV (bypass API) or go through `/api/quiz/grade`?** Direct = faster + avoids round-trip auth; API = single write path. Recommend: skill gets a `SKILL_TOKEN` that unlocks direct KV writes, so both paths work without coupling.
- **Difficulty/medium dropdown vs preset button per user** — do we let Su pick, or just hit "Ask me a question" and let Ash vary? Recommend: default button + a small "settings" disclosure for difficulty/topic.
- **Suvarcha's interests** — does Monte seed them for her, or does she pick on claim? Recommend: claim flow asks her for 3–5 interests right after she sets her password.

---

*Updated: 2026-04-17*
