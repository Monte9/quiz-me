# Quiz Me — Plan

Daily quizzes from Ash, persisted over time, visualized on a live site. Built on the history-stories pattern.

---

## Vision

A quiz habit that compounds. Ash asks Monte questions across difficulties (easy/medium/hard/xhard) and mediums (text/image). Every answered question is persisted. The site shows the daily rhythm: bar charts by day, correct-rate trend, topic breakdown, streak counter. Over time it becomes a map of what Monte has learned — and what he keeps getting wrong.

---

## Current State

- Repo: [nexuslabsx/quiz-me](https://github.com/nexuslabsx/quiz-me) (private), `main` pushed
- Next.js 16 + Tailwind 4, static export, mirrors history-stories scaffolding
- Build passes locally (`pnpm build` → static export of `/` and `/q/[id]`)
- `history.json` at repo root holds `interests` + `questions`; seeded with one welcome entry (deletable)
- Browse grid on `/`, detail page on `/q/[id]`, saffron-gold accent, difficulty color coding, xhard shows 1–5 thoughtfulness score instead of correct/wrong
- **Not yet:** Vercel not connected, skill not yet writing real quizzes, interests empty
- Writer skill: [ash-core/skills/quiz-me/SKILL.md](../ash-core/skills/quiz-me/SKILL.md) — persists updates to `history.json` and commits

---

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Repo | `nexuslabsx/quiz-me`, private; site public |
| 2 | State shape | Single `history.json` at repo root — `interests` + `questions` |
| 3 | Metrics | Questions/day (bar by difficulty), correct-rate line, streak, topic breakdown |
| 4 | Assets | `public/quiz/YYYYMMDD-HHmmss-<slug>.png` for image-medium questions |
| 5 | Domain | `quizme.vercel.app` for now |
| 6 | Mediums | `text` + `image` only (audio dropped) |
| 7 | xHard grading | Not correct/wrong — scored 1–5 on thoughtfulness + comprehensiveness |
| 8 | Skip | `result: "skipped"`; eligible for re-ask |
| 9 | Write cadence | **Once** per quiz, after grading. No write on question-shown. |
| 10 | Topics | `history.json.interests`. Skill asks on first run if empty. |

---

## Patterns Borrowed

| Source | Pattern | Use |
|---|---|---|
| history-stories | `history.json` tracker, git = DB, Vercel auto-deploy | Same |
| history-stories | `YYYYMMDD-HHmmss-<slug>` filenames | Same for image assets |
| history-stories | Static export (`output: "export"`) | Same through Phase 3; revisit Phase 4 |
| history-stories | Skill commits + pushes after generation | Same after grading |
| cursor-stats | `src/lib/stats.ts` aggregation (`byDay`, streaks) | Adapt into `src/lib/quiz-stats.ts` |
| cursor-stats | Recharts + dark theme + single accent | Same stack; accent = saffron-gold |
| cursor-stats | `format.ts` centralized formatters | Copy wholesale |

---

## `history.json` Shape

```json
{
  "interests": [{ "name": "roman-history", "addedAt": "2026-04-17T..." }],
  "questions": [
    {
      "id": "20260417-143022-mauryan-emperor",
      "difficulty": "medium",
      "medium": "text",
      "topic": "indian-history",
      "question": "...",
      "answerKey": "...",
      "userAnswer": "...",
      "result": "correct | partial | wrong | skipped",
      "thoughtfulnessScore": null,
      "imagePath": null,
      "grade": "<one-line feedback>",
      "createdAt": "2026-04-17T14:30:22-07:00"
    }
  ]
}
```

- `result` null for xhard; `thoughtfulnessScore` (1–5) non-null only for xhard
- `imagePath` populated only when `medium=image`
- Skipped questions keep everything except answer + grading fields

---

## Phases

### Phase 1: Deploy + first real quizzes (active)

- Import repo into Vercel (Monte) → alias `quizme.vercel.app`
- Update SKILL.md to write to `~/Projects/quiz-me/history.json`, commit `quiz: <difficulty> <topic> — <result>`, push
- On first run: skill reads `interests`; if empty, asks Monte for 3–5 topics and writes them back before the first question
- Delete the welcome seed entry once a real question lands
- **Exit:** Monte answers a question, refreshes the site on his phone 2 minutes later, sees it

### Phase 2: Charts

- `/stats` page with Recharts: bar chart (questions/day, stacked by difficulty), line (7-day correct-rate), horizontal bar (topic breakdown)
- `src/lib/quiz-stats.ts` — `byDay`, `byDifficulty`, `byTopic`, `byMedium`, streak, rolling correct-rate
- Stat tiles: total, current streak, longest streak, most-missed topic, avg xhard score

### Phase 3: Polish + topics UI

- Filters on browse: difficulty / medium / topic / result
- Homepage "today's question" card, else nudge
- `/interests` page to view/edit interests from browser
- OG card per question
- 9 PM cron nudge if no entry for today

### Phase 4: Trigger quizzes from the web app (nice-to-have)

Architectural shift: static export stops being enough.

- `/api/quiz/new` + `/api/quiz/grade` — Vercel serverless, Claude API
- Write-back: **(a) Vercel KV + nightly sync to `history.json`** (recommended, keeps git as source of truth), (b) GitHub App commits, (c) drop git-as-DB
- **Exit:** anyone hits the site, answers a question, sees it in the next day's bar

---

## Backlog

- Spaced repetition for wrong/skipped — re-ask at 3 / 7 / 30 days
- Topic hierarchy (`history/roman`, `ai/transformers`) for cleaner stats
- Session mode: "quiz me 5 hard" → batch with end-of-session summary
- Weekly digest (email/Slack): misses, streak, focus
- Image mode via `nano-banana` skill
- Difficulty auto-calibration per topic
- Export wrong answers to Anki
- Multi-user (Su, friends) with per-user streaks + shared leaderboard

---

## Open Questions

- xhard thoughtfulness rubric — what separates 3 from 4 from 5? Needs a short scoring guide in SKILL.md before the first xhard runs.
- For image-medium questions, does Ash expect an image-response? Default: text reply, revisit if interesting cases come up.

---

*Updated: 2026-04-17*
