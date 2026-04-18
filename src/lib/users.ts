import { sql } from "@/lib/db";

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

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    difficulty: row.difficulty as Difficulty,
    medium: row.medium as Medium,
    topic: row.topic as string,
    question: row.question as string,
    answerKey: row.answer_key as string,
    userAnswer: (row.user_answer as string | null) ?? null,
    result: (row.result as Result | null) ?? null,
    thoughtfulnessScore: (row.thoughtfulness_score as number | null) ?? null,
    imagePath: (row.image_path as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapUser(
  row: Record<string, unknown>,
  questions: Question[],
): User {
  return {
    username: row.username as string,
    displayName: row.display_name as string,
    createdAt: iso(row.created_at),
    claimedAt: row.claimed_at ? iso(row.claimed_at) : null,
    password: (row.password as string | null) ?? null,
    inviteCode: (row.invite_code as string | null) ?? null,
    interests: (row.interests as Interest[] | null) ?? [],
    questions,
  };
}

export async function getAllUsers(): Promise<User[]> {
  const [userRows, questionRows] = await Promise.all([
    sql`select * from users order by created_at asc`,
    sql`select * from questions order by created_at desc`,
  ]);

  const byUser = new Map<string, Question[]>();
  for (const row of questionRows) {
    const username = row.username as string;
    const arr = byUser.get(username) ?? [];
    arr.push(mapQuestion(row));
    byUser.set(username, arr);
  }

  return userRows.map((u) => mapUser(u, byUser.get(u.username as string) ?? []));
}

export async function getAllUsernames(): Promise<string[]> {
  const rows = await sql`select username from users`;
  return rows.map((r) => r.username as string);
}

export async function getUser(username: string): Promise<User | null> {
  const [userRows, questionRows] = await Promise.all([
    sql`select * from users where username = ${username}`,
    sql`select * from questions where username = ${username} order by created_at desc`,
  ]);
  if (userRows.length === 0) return null;
  return mapUser(userRows[0], questionRows.map(mapQuestion));
}

export async function getAllQuestions(): Promise<Question[]> {
  const rows = await sql`
    select * from questions order by created_at desc
  `;
  return rows.map(mapQuestion);
}

export async function getAllTopics(): Promise<string[]> {
  const rows = await sql`
    select distinct topic from questions order by topic asc
  `;
  return rows.map((r) => r.topic as string);
}

export async function getQuestionById(
  id: string,
): Promise<{ username: string; question: Question } | null> {
  const rows = await sql`
    select * from questions where id = ${id}
  `;
  if (rows.length === 0) return null;
  return {
    username: rows[0].username as string,
    question: mapQuestion(rows[0]),
  };
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
  return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
