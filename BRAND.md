# Quiz Me — Brand

Who this is for, how we talk about it, and every piece of marketing copy in one place.

See also: [PLAN.md](./PLAN.md) (what we're building).

---

## Positioning

Quiz Me is a personal trivia game. You pick the topics you love, Ash writes fresh questions tuned to you, challenges you across four difficulty tiers, and tracks your progress in charts you can come back to.

Two primary taglines (rotate on the landing page):

1. **Trivia that knows what you love.**
2. **Master the topics that matter to you.**

Both land for both ICPs. Tagline 1 leans warmer / trivia-first (Su). Tagline 2 leans mastery / depth (Monte).

---

## ICPs

Two archetypes, drawn from real users. Every copy decision should answer: does this land for both?

### ICP 1 — The Trivia Lover (Suvarcha)

- **Who:** Adult, curious, casual but committed intellectual hobbyist.
- **Signals:** Finishes the NYT crossword. Plays Wordle / Connections daily. Subscribes to NYT Games. Reads non-fiction on weekends. Pub-trivia regular.
- **Wants:** Well-constructed questions on things they already care about. Leaderboards are a turn-off. Wants to feel smart and learn a little along the way.
- **Use pattern:** Leisurely — evenings, weekends, in bursts.
- **What wins them:** Personalization ("oh, these are *my* topics"). Honest grading without harshness. Elegance of construction over flashy gamification.

### ICP 2 — The Topic Master (Monte)

- **Who:** Curious operator who wants to go deep on specific subjects.
- **Signals:** Reads books on Roman history, Indian mythology, Porsche cars, pickleball. Wants to be able to *clearly explain* concepts, not just recognize them. Has a short list of passions and goes deep on each.
- **Wants:** Daily practice. Progress they can *see*. Reminders that bring them back.
- **Use pattern:** Habitual — a few times a day, to keep knowledge sharp and fresh.
- **What wins them:** Depth + difficulty that scales. Charts showing consistency. Nudges (Telegram / SMS) that respect their time.

### Shared needs (both ICPs)

- **Personalized** — their topics, not a trivia-pack dump
- **Challenging** — honest grading, no repeats, difficulty that fits
- **Tracked** — a log + charts that show progress over time

### Divergent needs

| | Trivia Lover (Su) | Topic Master (Monte) |
|---|---|---|
| Frequency | Casual, when the mood hits | Daily habit, multiple sessions |
| Depth | Breadth across interests | Deep mastery of a few topics |
| Reminders | Optional, gentle | Explicit want (Telegram / SMS) |
| Competition | No | No |
| Social | Light (share the log) | Light (share the log) |

**Neither wants:** leaderboards, guilt-streaks, timed pressure, infantilized UX.

---

## What we're NOT

- **Sporcle / Trivia Crack** — shallow, gamified, random trivia-pack content
- **Kahoot** — classroom, timed, leaderboard-first
- **Duolingo for trivia** — guilt-streaks, cartoon nagging, infantilized
- **Anki flashcards** — user writes their own cards; we write the questions for you

---

## Value prop — three pillars

1. **Personalized.** Pick the topics you actually love. Ash writes questions on those.
2. **Challenging.** Four difficulty tiers, from yes/no to unsolved-problem. No repeats, no sycophancy. Ash tells you when you're wrong.
3. **Tracked.** Every answer lives in your public log. Charts show your progress day over day.

---

## Taglines

**Primary (rotating on the landing page):**
- Trivia that knows what you love.
- Master the topics that matter to you.

**Supporting lines (use in secondary placements):**
- Personal trivia. Real challenge. Real progress.
- The trivia game for people who finish the crossword.

---

## Voice

Ash-voice, not marketing-voice. Direct but warm. Plain language, short sentences.

**Do:**
- Second person ("you pick the topics")
- Triads with parallel structure ("Personalized. Honestly graded. Tracked.")
- Concrete nouns ("charts", "log", "questions") over abstractions ("insights", "intelligence")
- Talk about Ash as a person ("Ash writes the question"), not a "system" or "AI-powered engine"

**Don't:**
- "AI-powered", "smart", "intelligent", "unlock", "seamlessly", "effortlessly"
- Exclamation points for emphasis
- Feature-listing verbosity ("with our advanced difficulty tiers…")
- Em dashes. They read as AI-written, and this is a dyad, not a bot. Use periods or regular hyphens.
- Generic trivia-app clichés ("challenge yourself today!")

---

## Copy by page

Single source of truth. Update here first, then mirror into the code. If a page below doesn't appear in the code yet, that's the plan for when it lands.

### `/` — Home

**BrandBar** (`BrandBar.tsx`)
```
Quiz Me
```

**Hero eyebrow** (`Hero.tsx`)
```
For trivia nerds
```

**Hero H1** (rotating crossfade between two variants, swap every ~5s)
```
Variant A:
  Trivia that knows
  what you love.

Variant B:
  Master the topics
  that matter to you.
```
Line break falls after the lead phrase; the second line is rendered in the accent color.

**Hero subhead**
```
Personalized to your topics. Questions that challenge you. Charts that track your progress.
```

**AskMePanel heading** (`AskMePanel.tsx`)
```
Ask Ash
```

**AskMePanel prompt** (above difficulty buttons)
```
Pick your difficulty. Ash writes the question.
```

**Stat tile labels** (`page.tsx`)
```
Users · Questions · Topics
```

**Recent questions section heading**
```
Recent questions
See all →
```

### `/users`

**Page H1**
```
Users
```

**Page subhead**
```
Everyone who's getting quizzed. Click through to see their public log.
```

**JoinCard title**
```
Join Quiz Me
```

**JoinCard status**
```
Invite only
```

**JoinCard body**
```
Get your own public quiz page. Pick your topics, pick your difficulty, answer an AI-generated question daily, or whenever you want.
```

**JoinCard CTA**
```
Ask Monte for an invite →
```

### `/[user]` — per-user log

No page-level marketing copy; the user's name is the headline. Interests chips and stat labels live here.

### `/questions`

**Page H1**
```
Questions
```

**Page subhead**
```
Every question Ash has ever asked. Filter by difficulty or topic.
```

**Stat tile labels**
```
Questions · Topics · Correct
```

**Section heading (filtered)**
```
Matching
```

**Section heading (unfiltered)**
```
All questions
```

### `/questions/[id]` — question detail

No page-level marketing copy. Attribution line links back to `/[user]`.

### Footer (every page)

**Nav**
```
Home · Users · Questions
```

**Credit**
```
Built by the Ash + Monte dyad
```

---

*Updated: 2026-04-18*
