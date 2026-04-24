import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { callJSON, modelForDifficulty } from "@/lib/claude";
import { discoverGenerationPrompt, generationPrompt } from "@/lib/prompts";
import {
  difficultySchema,
  getAllUserTopics,
  getRecentQuestionsForTopic,
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
  // answerKey is required for easy/medium (shown on reveal + /questions/[id]),
  // and no longer generated for hard/xhard (grade carries reference now).
  answerKey: z.string().optional(),
  slug: z.string().optional().default(""),
  options: z.array(z.string().min(1)).optional(),
  correctIndex: z.number().int().min(0).optional(),
  topic: z.string().optional(),
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

  const isDiscover = preferred === "discover";

  // Discover mode doesn't require interests — it's the escape hatch.
  if (!isDiscover && ctx.interests.length === 0) {
    return NextResponse.json(
      { error: "no interests set for user" },
      { status: 409 },
    );
  }

  let topic: string;
  let gen: z.infer<typeof genOutputSchema>;
  const model = modelForDifficulty(difficulty);

  if (isDiscover) {
    const interestNames = ctx.interests.map((i) => i.name);
    const pastTopics = await getAllUserTopics(username);
    const excludeTopics = Array.from(
      new Set([...interestNames, ...pastTopics]),
    );
    try {
      const { system, user } = discoverGenerationPrompt(
        difficulty,
        excludeTopics,
      );
      gen = await callJSON({
        system,
        user,
        schema: genOutputSchema,
        maxTokens: 1500,
        model,
      });
    } catch (err) {
      console.error("claude discover generation failed", err);
      return NextResponse.json({ error: "generation failed" }, { status: 502 });
    }
    if (!gen.topic || gen.topic.trim() === "") {
      console.error("discover mode returned no topic", { gen });
      return NextResponse.json(
        { error: "discover mode returned no topic" },
        { status: 502 },
      );
    }
    topic = gen.topic.trim().toLowerCase();
  } else {
    const picked = pickTopic(ctx.interests, ctx.recentTopics, preferred);
    if (!picked) {
      return NextResponse.json({ error: "could not pick topic" }, { status: 500 });
    }
    topic = picked;
    const recentQuestions = await getRecentQuestionsForTopic(username, topic, 20);
    try {
      const { system, user } = generationPrompt(
        difficulty,
        topic,
        recentQuestions,
      );
      gen = await callJSON({
        system,
        user,
        schema: genOutputSchema,
        maxTokens: 1500,
        model,
      });
    } catch (err) {
      console.error("claude generation failed", err);
      return NextResponse.json({ error: "generation failed" }, { status: 502 });
    }
  }

  // Validate multiple-choice shape for easy + medium. MC requires answerKey
  // too (displayed on reveal). Freeform hard/xhard intentionally skips
  // answerKey — the grade at submit time carries the reference material.
  let options: string[] | null = null;
  let correctIndex: number | null = null;
  let answerKey: string | null = null;
  if (difficulty === "easy" || difficulty === "medium") {
    const expectedLen = difficulty === "easy" ? 2 : 4;
    if (
      !gen.options ||
      gen.options.length !== expectedLen ||
      gen.correctIndex === undefined ||
      gen.correctIndex < 0 ||
      gen.correctIndex >= expectedLen ||
      !gen.answerKey
    ) {
      console.error("claude returned invalid MC payload", {
        difficulty,
        options: gen.options,
        correctIndex: gen.correctIndex,
        hasAnswerKey: Boolean(gen.answerKey),
      });
      return NextResponse.json({ error: "generation returned invalid options" }, { status: 502 });
    }
    options = gen.options;
    correctIndex = gen.correctIndex;
    answerKey = gen.answerKey;
  }

  const now = new Date();
  const id = `${idPrefix(now)}-${slugify(gen.slug || topic)}`;

  await sql`
    insert into questions (
      id, username, difficulty, medium, topic, question, answer_key,
      options, correct_index,
      user_answer, result, thoughtfulness_score, image_path, grade,
      model, status, created_at, graded_at
    )
    values (
      ${id}, ${username}, ${difficulty}, 'text', ${topic},
      ${gen.question}, ${answerKey},
      ${options ? JSON.stringify(options) : null}::jsonb, ${correctIndex},
      null, null, null, null, null,
      ${model}, 'pending', ${now.toISOString()}, null
    )
  `;

  // Return options so the UI can render choices; correctIndex is never leaked
  // — the client submits selectedIndex and the server validates.
  return NextResponse.json({
    questionId: id,
    difficulty,
    topic,
    question: gen.question,
    options,
  });
}
