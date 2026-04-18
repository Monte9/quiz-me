import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { callJSON } from "@/lib/claude";
import { generationPrompt } from "@/lib/prompts";
import {
  difficultySchema,
  idPrefix,
  loadQuizContext,
  pickTopic,
  slugify,
} from "@/lib/quiz";

const bodySchema = z.object({
  username: z.string().min(1).regex(/^[a-z0-9_-]+$/, "invalid username"),
  difficulty: difficultySchema.optional(),
  topic: z.string().optional(),
});

const genOutputSchema = z.object({
  question: z.string().min(1),
  answerKey: z.string().min(1),
  slug: z.string().optional().default(""),
});

export async function POST(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }
  const { username, difficulty = "medium", topic: preferred = null } = parsed.data;

  const ctx = await loadQuizContext(username);
  if (!ctx) return NextResponse.json({ error: "user not found" }, { status: 404 });
  if (ctx.interests.length === 0) {
    return NextResponse.json(
      { error: "no interests set for user" },
      { status: 409 },
    );
  }

  const topic = pickTopic(ctx.interests, ctx.recentTopics, preferred);
  if (!topic) {
    return NextResponse.json({ error: "could not pick topic" }, { status: 500 });
  }

  let gen: z.infer<typeof genOutputSchema>;
  try {
    const { system, user } = generationPrompt(difficulty, topic, ctx.recentTopics);
    gen = await callJSON({
      system,
      user,
      schema: genOutputSchema,
      maxTokens: 1500,
    });
  } catch (err) {
    console.error("claude generation failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
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
      ${id}, ${username}, ${difficulty}, 'text', ${topic},
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
