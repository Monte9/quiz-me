import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callJSON } from "@/lib/claude";
import { generationPrompt } from "@/lib/prompts";
import {
  idPrefix,
  isDifficulty,
  loadQuizContext,
  pickTopic,
  slugify,
} from "@/lib/quiz";

const USERNAME = "monte";

interface NewBody {
  difficulty?: unknown;
  topic?: unknown;
}

interface GenOutput {
  question: string;
  answerKey: string;
  slug: string;
}

export async function POST(req: Request) {
  let body: NewBody;
  try {
    body = (await req.json()) as NewBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const difficulty = body.difficulty ?? "medium";
  if (!isDifficulty(difficulty)) {
    return NextResponse.json(
      { error: "difficulty must be easy|medium|hard|xhard" },
      { status: 400 },
    );
  }

  const ctx = await loadQuizContext(USERNAME);
  if (!ctx) return NextResponse.json({ error: "user not found" }, { status: 404 });
  if (ctx.interests.length === 0) {
    return NextResponse.json(
      { error: "no interests set for user" },
      { status: 409 },
    );
  }

  const preferred = typeof body.topic === "string" ? body.topic : null;
  const topic = pickTopic(ctx.interests, ctx.recentTopics, preferred);
  if (!topic) {
    return NextResponse.json({ error: "could not pick topic" }, { status: 500 });
  }

  let gen: GenOutput;
  try {
    const { system, user } = generationPrompt(difficulty, topic, ctx.recentTopics);
    gen = await callJSON<GenOutput>({ system, user, maxTokens: 1500 });
  } catch (err) {
    console.error("claude generation failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }

  if (!gen.question || !gen.answerKey) {
    return NextResponse.json(
      { error: "generation returned incomplete payload" },
      { status: 502 },
    );
  }

  const now = new Date();
  const id = `${idPrefix(now)}-${slugify(gen.slug || topic)}`;

  await sql`
    insert into questions (
      id, username, difficulty, medium, topic, question, answer_key,
      user_answer, result, thoughtfulness_score, image_path, grade,
      status, created_at, graded_at
    )
    values (
      ${id}, ${USERNAME}, ${difficulty}, 'text', ${topic},
      ${gen.question}, ${gen.answerKey},
      null, null, null, null, null,
      'pending', ${now.toISOString()}, null
    )
  `;

  return NextResponse.json({
    questionId: id,
    difficulty,
    topic,
    question: gen.question,
  });
}
