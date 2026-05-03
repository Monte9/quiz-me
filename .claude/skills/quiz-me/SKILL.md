---
name: quiz-me
description: "Quiz Monte (or Su) with a single question at a chosen difficulty and medium, grade honestly, and persist the result to this repo. Use when he says 'quiz me', 'quiz me easy/medium/hard/xhard', or specifies a medium like 'quiz me medium image'. Default: medium difficulty, text medium."
---

# Quiz Me

Ask Monte a single question. Pick something interesting, vary topics across runs, and keep it tight. One question per invocation — wait for his answer, grade it, then persist to this repo so it shows up at [quizmenexus.vercel.app](https://quizmenexus.vercel.app).

## Paths

This skill lives **inside** the `quiz-me` repo at `.claude/skills/quiz-me/`. All paths below are relative to the repo root. Find the absolute root with `git rev-parse --show-toplevel` if you need it.

| Item | Path (relative to repo root) |
|------|------|
| **User data** | `users.json` |
| **Quiz images** (when `medium=image`) | `public/quiz/YYYYMMDD-HHmmss-<slug>.png` |
| **Web path for image** (stored in `imagePath`) | `/quiz/YYYYMMDD-HHmmss-<slug>.png` |

## Invocation

He'll say things like:
- `quiz me` → default (medium, text)
- `quiz me easy` → easy, text
- `quiz me hard image` → hard, image
- `quiz me xhard` → xhard, text
- `quiz me medium` → medium, text

Parse two axes from his message: **difficulty** and **medium**. Missing either → use defaults.

## Difficulty

| Level | Shape | Example |
|-------|-------|---------|
| `easy` | Binary. Yes/No only. | "Did Julius Caesar cross the Rubicon in 49 BCE?" |
| `medium` | One-word answer. A name, place, animal, or thing. | "Which Mauryan emperor built the Sanchi Stupa?" |
| `hard` | Explain a concept or how something works. Short essay. | "How does a transformer model's attention mechanism actually work?" |
| `xhard` | Propose a solution to an unsolved world problem. **Always include 1–2 paragraphs of context on current approaches** — what's been tried, who's tried it, why it's stalled — before asking the question. Monte should know the landscape before proposing a solution. |

**Default:** `medium`.

### Grading by difficulty

- **easy / medium / hard** → `result` is `correct | partial | wrong`
- **xhard** → not correct/wrong. Score 1–5 on **thoughtfulness + comprehensiveness**: did he consider the right input variables, tradeoffs, and stakeholders? Rubric: 1 = surface take; 3 = solid framing, missing a dimension; 5 = considers all major input variables, weighs tradeoffs, anticipates second-order effects. Write `result: null`, set `thoughtfulnessScore`.

## Medium

| Medium | How to deliver the question |
|--------|----------------------------|
| `text` | Plain text question in the response. |
| `image` | Generate an image that *poses* the question visually (e.g., a painting of a historical scene and ask "who is this?"). Save to `public/quiz/YYYYMMDD-HHmmss-<slug>.png`. Include a short text prompt alongside. `imagePath` in the question is the **web path** `/quiz/YYYYMMDD-HHmmss-<slug>.png` (not filesystem). |

**Default:** `text`. Audio is not supported.

### Image medium — local vs cloud agent

- **Local agent (Cursor / Claude Code on Monte's laptop):** call the `nano-banana` skill (it's symlinked into `~/.claude/skills/nano-banana/` from `ash-core`). It's a thin wrapper around Gemini's image API.
- **Cloud agent (Claude Code Cowork / Cursor Cloud on this repo):** the `nano-banana` skill is **not available** — cross-project skills don't ship with cloud-agent clones. For now, **fall back to text medium** and tell Monte: *"Image medium needs the local nano-banana skill. Falling back to text. (Inline Gemini API support in this repo is a TODO.)"* If/when image medium becomes a real cloud need, we'll inline the Gemini call into this skill or copy the script into `.claude/skills/quiz-me/scripts/`.

## Topics (interests)

Monte (or Su, when she claims) only wants to be quizzed on topics they care about. The list lives at `users.<name>.interests` in `users.json`.

- **Before the first question:** read `users.json`. If `users.<name>.interests` is empty, ask: *"What 3–5 topics do you want to be quizzed on? (e.g., roman-history, indian-mythology, ai-ml, systems-engineering, philosophy)"*. Write the answer back as `interests: [{ name, addedAt }]` and commit as `chore: seed interests for <name>`.
- **Once interests exist:** pick a topic from them. Rotate — don't repeat the last 5 topics from `users.<name>.questions`.
- Never invent topics outside the interests list.

## Skip

If Monte says `skip` or declines to answer, write the question with `result: "skipped"`, `userAnswer: null`, `grade: null`. It's eligible for re-ask later.

## Flow

1. Parse `difficulty` + `medium` from his message.
2. Read `users.json`.
3. If `users.<name>.interests` is empty → bootstrap (see Topics section above). Commit the interests seed, then proceed.
4. Pick a topic from `users.<name>.interests` that hasn't appeared in the last 5 `users.<name>.questions`.
5. Form the question to match the difficulty shape exactly. For `image` medium, follow the local-vs-cloud branching above before forming the question.
6. Deliver the question in chat.
7. **Wait for the answer.** Don't reveal the answer until Monte responds.
8. Grade honestly:
   - easy/medium: right or wrong + correct answer + one line of context
   - hard: evaluate reasoning — what was sharp, what he missed, what a stronger take looks like
   - xhard: score 1–5 on thoughtfulness, explain the score, note what dimensions he missed
   - Don't be sycophantic.
9. **Write once** to `users.<name>.questions` — after grading, not before:

```json
{
  "id": "YYYYMMDD-HHmmss-<slug>",
  "difficulty": "easy|medium|hard|xhard",
  "medium": "text|image",
  "topic": "<interest name>",
  "question": "<the question asked, including xhard context paragraphs>",
  "answerKey": "<correct answer or reference framing>",
  "userAnswer": "<the user's answer, or null if skipped>",
  "result": "correct|partial|wrong|skipped|null",
  "thoughtfulnessScore": null,
  "imagePath": null,
  "grade": "<one-line feedback, or null if skipped>",
  "createdAt": "<ISO 8601 with TZ offset>"
}
```

- `thoughtfulnessScore`: integer 1–5 only for xhard; null otherwise
- `imagePath`: `/quiz/<filename>.png` only when `medium=image`; null otherwise
- `id`: same timestamp-slug as any image asset, so they stay paired

10. Commit and push from the repo root:

```bash
cd "$(git rev-parse --show-toplevel)"
git add users.json public/quiz
git commit -m "quiz: <difficulty> <topic> — <result-or-score>"
git push
```

Example commit messages:
- `quiz: medium indian-history — correct`
- `quiz: xhard global-policy — 4/5`
- `quiz: hard ai-ml — skipped`

Vercel auto-deploys on push; the question shows up at [quizmenexus.vercel.app](https://quizmenexus.vercel.app) in ~30 seconds.

## Tone

Direct. No "Great, let's get started!" preamble. Just ask the question. When grading, be the friend who actually tells you when you're wrong.

## Known gap

The web UI's question generation pipeline (in `src/app/api/quiz/new`) emits multiple-choice for easy/medium with `options` + `correctIndex` + `model` (per `migration 004`). This skill currently writes freeform questions for all difficulties. Skill-written easy/medium will display as freeform, not MC, until this is reconciled. Tracked in `PLAN.md` § Backlog ("Skill coherence gap").
