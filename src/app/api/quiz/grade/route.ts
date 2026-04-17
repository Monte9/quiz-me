import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callJSON } from "@/lib/claude";
import { gradingPrompt } from "@/lib/prompts";
import type { Difficulty, Result } from "@/lib/users";

const USERNAME = "monte";

interface GradeBody {
  questionId?: unknown;
  userAnswer?: unknown;
}

type EasyMedHardGrade = { result: Result; grade: string };
type XHardGrade = { thoughtfulnessScore: number; grade: string };

export async function POST(req: Request) {
  let body: GradeBody;
  try {
    body = (await req.json()) as GradeBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (typeof body.questionId !== "string") {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }
  const questionId = body.questionId;
  const userAnswerRaw = typeof body.userAnswer === "string" ? body.userAnswer : "";
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
      const graded = await callJSON<XHardGrade>({ system, user, maxTokens: 600 });
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

    const graded = await callJSON<EasyMedHardGrade>({
      system,
      user,
      maxTokens: 400,
    });
    const result: Result =
      graded.result === "correct" || graded.result === "partial" || graded.result === "wrong"
        ? graded.result
        : "wrong";
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
