import { sql } from "@/lib/db";
import type {
  Difficulty,
  Interest,
  Medium,
  Question,
  Result,
  User,
} from "@/lib/quiz-core";

// Re-export pure types + helpers so existing imports keep working.
// Client components should prefer importing directly from `@/lib/quiz-core`
// to avoid pulling this module (and `@/lib/db`) into the browser bundle.
export * from "@/lib/quiz-core";

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    username: row.username as string,
    difficulty: row.difficulty as Difficulty,
    medium: row.medium as Medium,
    topic: row.topic as string,
    question: row.question as string,
    answerKey: (row.answer_key as string | null) ?? null,
    options: (row.options as string[] | null) ?? null,
    correctIndex: (row.correct_index as number | null) ?? null,
    userAnswer: (row.user_answer as string | null) ?? null,
    result: (row.result as Result | null) ?? null,
    thoughtfulnessScore: (row.thoughtfulness_score as number | null) ?? null,
    imagePath: (row.image_path as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapUser(row: Record<string, unknown>, questions: Question[]): User {
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

  return userRows.map((u) =>
    mapUser(u, byUser.get(u.username as string) ?? []),
  );
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
