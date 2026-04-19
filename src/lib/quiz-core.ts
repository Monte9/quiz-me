/**
 * Pure types + stat helpers for quiz data.
 *
 * This module has NO server-only dependencies (no DB, no `sql`), so it
 * is safe to import from client components. Keep it that way — anything
 * that touches `@/lib/db` belongs in `@/lib/users`.
 */

export type Difficulty = "easy" | "medium" | "hard" | "xhard";
export type Medium = "text" | "image";
export type Result = "correct" | "partial" | "wrong" | "skipped";

export interface Interest {
  name: string;
  addedAt: string;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  medium: Medium;
  topic: string;
  question: string;
  answerKey: string;
  options: string[] | null;
  correctIndex: number | null;
  userAnswer: string | null;
  result: Result | null;
  thoughtfulnessScore: number | null;
  imagePath: string | null;
  grade: string | null;
  createdAt: string;
}

export interface User {
  username: string;
  displayName: string;
  createdAt: string;
  claimedAt: string | null;
  password: string | null;
  inviteCode: string | null;
  interests: Interest[];
  questions: Question[];
}

export interface UserStats {
  total: number;
  graded: number;
  correct: number;
  correctRate: number | null;
  streak: number;
  topTopic: string | null;
  xhardAvg: number | null;
}

export function computeStats(user: User): UserStats {
  const total = user.questions.length;
  const graded = user.questions.filter(
    (q) => q.result && q.result !== "skipped",
  );
  const correct = graded.filter((q) => q.result === "correct").length;
  const correctRate = graded.length
    ? Math.round((correct / graded.length) * 100)
    : null;

  const topicCounts = new Map<string, number>();
  for (const q of user.questions) {
    topicCounts.set(q.topic, (topicCounts.get(q.topic) ?? 0) + 1);
  }
  const topTopic =
    [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const xhard = user.questions.filter(
    (q) => q.difficulty === "xhard" && q.thoughtfulnessScore != null,
  );
  const xhardAvg = xhard.length
    ? xhard.reduce((s, q) => s + (q.thoughtfulnessScore ?? 0), 0) / xhard.length
    : null;

  const streak = computeStreak(user.questions);

  return {
    total,
    graded: graded.length,
    correct,
    correctRate,
    streak,
    topTopic,
    xhardAvg,
  };
}

function computeStreak(questions: Question[]): number {
  if (questions.length === 0) return 0;
  const dates = new Set(questions.map((q) => q.createdAt.slice(0, 10)));
  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(new Date(today.getTime() - 86400000));

  let cursor: Date;
  if (dates.has(todayStr)) cursor = today;
  else if (dates.has(yesterdayStr))
    cursor = new Date(today.getTime() - 86400000);
  else return 0;

  let streak = 0;
  while (dates.has(toDateString(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sortQuestionsByDate(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface ContextStats {
  total: number;
  graded: number;
  correct: number;
  correctRate: number | null;
  trend: "up" | "down" | "flat" | null;
  xhardAvg: number | null;
  uniqueTopics: number;
}

/**
 * Stats for a given topic + difficulty slice.
 *
 * - topic: "" (random/any), "discover", or a specific topic name
 * - difficulty: filter to this difficulty only
 *
 * For "" and "discover" the slice ignores topic and matches any question
 * at the given difficulty; "discover" additionally surfaces uniqueTopics.
 *
 * correctRate is null when fewer than 3 graded answers exist.
 * trend is null when fewer than 6 graded answers exist. Otherwise
 * it's computed by comparing the correct rate of the older half vs.
 * the newer half (>5pp swing = up/down, else flat).
 */
export function computeContextStats(
  questions: Question[],
  topic: string,
  difficulty: Difficulty,
): ContextStats {
  const specific = topic !== "" && topic !== "discover";
  const slice = questions.filter((q) => {
    if (q.difficulty !== difficulty) return false;
    if (specific && q.topic !== topic) return false;
    return true;
  });

  const graded = slice.filter((q) => q.result && q.result !== "skipped");
  const correct = graded.filter((q) => q.result === "correct").length;
  const correctRate =
    graded.length >= 3 ? Math.round((correct / graded.length) * 100) : null;

  let trend: ContextStats["trend"] = null;
  if (graded.length >= 6) {
    const asc = [...graded].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    const half = Math.floor(asc.length / 2);
    const older = asc.slice(0, half);
    const newer = asc.slice(asc.length - half);
    const olderRate =
      older.filter((q) => q.result === "correct").length / older.length;
    const newerRate =
      newer.filter((q) => q.result === "correct").length / newer.length;
    const diff = (newerRate - olderRate) * 100;
    if (diff > 5) trend = "up";
    else if (diff < -5) trend = "down";
    else trend = "flat";
  }

  const xhardScored = slice.filter(
    (q) => q.difficulty === "xhard" && q.thoughtfulnessScore != null,
  );
  const xhardAvg = xhardScored.length
    ? xhardScored.reduce((s, q) => s + (q.thoughtfulnessScore ?? 0), 0) /
      xhardScored.length
    : null;

  const topicSet = new Set(slice.map((q) => q.topic));

  return {
    total: slice.length,
    graded: graded.length,
    correct,
    correctRate,
    trend,
    xhardAvg,
    uniqueTopics: topicSet.size,
  };
}

/**
 * Most-recently-quizzed topics that aren't already in the user's
 * registered interests. Useful as a "recent" quick-pick section in the
 * topic picker. Returns at most `limit` names (default 3), newest first,
 * de-duplicated.
 */
export function recentTopics(
  questions: Question[],
  excludeNames: string[],
  limit = 3,
): string[] {
  const exclude = new Set(excludeNames.map((n) => n.toLowerCase()));
  const sorted = [...questions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of sorted) {
    const key = q.topic.toLowerCase();
    if (exclude.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q.topic);
    if (out.length >= limit) break;
  }
  return out;
}
