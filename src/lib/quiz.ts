import { sql } from "@/lib/db";
import type { Difficulty, Interest } from "@/lib/users";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "xhard"];

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as string[]).includes(v);
}

export function idPrefix(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}-${get("hour")}${get("minute")}${get("second")}`;
}

export function slugify(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "q"
  );
}

export async function loadQuizContext(username: string): Promise<{
  interests: Interest[];
  recentTopics: string[];
} | null> {
  const userRows = await sql`
    select interests from users where username = ${username}
  `;
  if (userRows.length === 0) return null;

  const topicRows = await sql`
    select topic from questions
    where username = ${username}
    order by created_at desc
    limit 5
  `;

  return {
    interests: (userRows[0].interests as Interest[]) ?? [],
    recentTopics: topicRows.map((r) => r.topic as string),
  };
}

export function pickTopic(
  interests: Interest[],
  recentTopics: string[],
  preferred?: string | null,
): string | null {
  const names = interests.map((i) => i.name);
  if (names.length === 0) return null;

  if (preferred && names.includes(preferred)) return preferred;

  const fresh = names.filter((n) => !recentTopics.includes(n));
  const pool = fresh.length > 0 ? fresh : names;
  return pool[Math.floor(Math.random() * pool.length)];
}
