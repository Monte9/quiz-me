"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/lib/quiz-core";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "xhard"];

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  xhard: "xHard",
};

const difficultyActive: Record<Difficulty, string> = {
  easy: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  medium: "border-sky-500/50 bg-sky-500/15 text-sky-300",
  hard: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  xhard: "border-red-500/50 bg-red-500/15 text-red-300",
};

function buildHref(overrides: {
  difficulty?: string | null;
  topic?: string | null;
}) {
  const params = new URLSearchParams();
  if (overrides.difficulty) params.set("difficulty", overrides.difficulty);
  if (overrides.topic) params.set("topic", overrides.topic);
  const qs = params.toString();
  return qs ? `/questions?${qs}` : "/questions";
}

export function QuestionFilters({
  topics,
  difficulty,
  topic,
}: {
  topics: string[];
  difficulty: Difficulty | null;
  topic: string | null;
}) {
  const router = useRouter();

  const pillBase =
    "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.15em] uppercase transition-colors";
  const pillInactive =
    "border-[var(--color-border)] bg-[var(--color-bg-raised)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-dim)]";

  return (
    <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={buildHref({ topic })}
          className={`${pillBase} ${
            difficulty === null
              ? "border-[var(--color-text-dim)]/60 bg-[var(--color-surface)] text-[var(--color-text)]"
              : pillInactive
          }`}
        >
          All
        </Link>
        {DIFFICULTIES.map((d) => (
          <Link
            key={d}
            href={buildHref({ difficulty: d, topic })}
            className={`${pillBase} ${
              difficulty === d ? difficultyActive[d] : pillInactive
            }`}
          >
            {difficultyLabels[d]}
          </Link>
        ))}
      </div>

      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="topic-filter"
            className="text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase"
          >
            Topic
          </label>
          <select
            id="topic-filter"
            value={topic ?? ""}
            onChange={(e) => {
              const next = e.target.value || null;
              router.push(buildHref({ difficulty, topic: next }));
            }}
            className="cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-3 py-1.5 text-xs font-semibold tracking-[0.1em] text-[var(--color-text-dim)] uppercase transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent-dim)] focus:outline-none"
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
