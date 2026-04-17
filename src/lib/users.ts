import fs from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "users.json");

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

interface UsersFile {
  users: Record<string, Omit<User, "username">>;
}

function readUsersFile(): UsersFile {
  if (!fs.existsSync(usersPath)) return { users: {} };
  try {
    const raw = fs.readFileSync(usersPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<UsersFile>;
    return { users: parsed.users ?? {} };
  } catch {
    return { users: {} };
  }
}

export function getAllUsers(): User[] {
  const { users } = readUsersFile();
  return Object.entries(users)
    .map(([username, data]) => ({ username, ...data }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAllUsernames(): string[] {
  return Object.keys(readUsersFile().users);
}

export function getUser(username: string): User | null {
  const { users } = readUsersFile();
  const data = users[username];
  if (!data) return null;
  return { username, ...data };
}

export function getQuestionById(
  username: string,
  id: string,
): Question | null {
  const user = getUser(username);
  if (!user) return null;
  return user.questions.find((q) => q.id === id) ?? null;
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
  const dates = new Set(
    questions.map((q) => q.createdAt.slice(0, 10)),
  );
  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(
    new Date(today.getTime() - 86400000),
  );

  let cursor: Date;
  if (dates.has(todayStr)) cursor = today;
  else if (dates.has(yesterdayStr)) cursor = new Date(today.getTime() - 86400000);
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
  return [...questions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
