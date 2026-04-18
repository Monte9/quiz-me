import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { callJSON } from "@/lib/claude";
import { gradingPrompt } from "@/lib/prompts";
import type { Difficulty, Result } from "@/lib/users";

const USERNAME = "monte";

const bodySchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string().optional().default(""),
});

const easyMedHardGradeSchema = z.object({
  result: z.enum(["correct", "partial", "wrong"]),
  grade: z.string().min(1),
});

const xhardGradeSchema = z.object({
  thoughtfulnessScore: z.number(),
  grade: z.string().min(1),
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
      { error: "questionId required" },
      { status: 400 },
    );
  }
  const { questionId, userAnswer: userAnswerRaw } = parsed.data;
  const userAnswer = userAnswerRaw.trim();

  const rows = await sql`
    select id, username, difficulty, question, answer_key, status
    from questions where id = ${questionId}
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }
  const q = rows[0];
  if (q.username !== USERNAME) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (q.status !== "pending") {
    return NextResponse.json(
      { error: "question already graded" },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  if (userAnswer === "") {
    await sql`
      update questions set
        user_answer = null,
        result      = 'skipped',
        status      = 'skipped',
        graded_at   = ${now}
      where id = ${questionId}
    `;
    return NextResponse.json({
      result: "skipped",
      grade: null,
      thoughtfulnessScore: null,
      answerKey: q.answer_key,
    });
  }

  const difficulty = q.difficulty as Difficulty;

  try {
    const { system, user } = gradingPrompt(
      difficulty,
      q.question as string,
      q.answer_key as string,
      userAnswer,
    );

    if (difficulty === "xhard") {
      const graded = await callJSON({
        system,
        user,
        schema: xhardGradeSchema,
        maxTokens: 600,
      });
      const score = Math.max(1, Math.min(5, Math.round(graded.thoughtfulnessScore)));
      await sql`
        update questions set
          user_answer          = ${userAnswer},
          result               = null,
          thoughtfulness_score = ${score},
          grade                = ${graded.grade},
          status               = 'graded',
          graded_at            = ${now}
        where id = ${questionId}
      `;
      return NextResponse.json({
        result: null,
        grade: graded.grade,
        thoughtfulnessScore: score,
        answerKey: q.answer_key,
      });
    }

    const graded = await callJSON({
      system,
      user,
      schema: easyMedHardGradeSchema,
      maxTokens: 400,
    });
    const result: Result = graded.result;
    await sql`
      update questions set
        user_answer = ${userAnswer},
        result      = ${result},
        grade       = ${graded.grade},
        status      = 'graded',
        graded_at   = ${now}
      where id = ${questionId}
    `;
    return NextResponse.json({
      result,
      grade: graded.grade,
      thoughtfulnessScore: null,
      answerKey: q.answer_key,
    });
  } catch (err) {
    console.error("claude grading failed", err);
    return NextResponse.json({ error: "grading failed" }, { status: 502 });
  }
}
