"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Difficulty, Interest, Result } from "@/lib/users";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "asking";
      questionId: string;
      difficulty: Difficulty;
      topic: string;
      question: string;
      options: string[] | null;
    }
  | {
      kind: "grading";
      questionId: string;
      difficulty: Difficulty;
      topic: string;
      question: string;
      options: string[] | null;
    }
  | {
      kind: "revealed";
      difficulty: Difficulty;
      topic: string;
      question: string;
      userAnswer: string;
      result: Result | null;
      thoughtfulnessScore: number | null;
      grade: string | null;
      answerKey: string;
    };

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  xhard: "xHard",
};

const difficultyAccent: Record<Difficulty, string> = {
  easy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  medium: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  hard: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  xhard: "border-red-500/40 bg-red-500/10 text-red-300",
};

const resultStyles: Record<Result, string> = {
  correct: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  wrong: "bg-red-500/15 text-red-300 border-red-500/30",
  skipped: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const resultLabels: Record<Result, string> = {
  correct: "Correct",
  partial: "Partial",
  wrong: "Wrong",
  skipped: "Skipped",
};

interface NewQuizResponse {
  questionId: string;
  difficulty: Difficulty;
  topic: string;
  question: string;
  options: string[] | null;
}

interface GradeResponse {
  result: Result | null;
  grade: string | null;
  thoughtfulnessScore: number | null;
  answerKey: string;
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "something went wrong";
}

export function AskMePanel({
  username,
  interests,
}: {
  username: string;
  interests: Interest[];
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showTopic, setShowTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startQuiz(difficulty: Difficulty) {
    setError(null);
    setAnswer("");
    setShowAnswerKey(false);
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/quiz/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          difficulty,
          topic: topic || undefined,
        }),
      });
      const data = (await res.json()) as Partial<NewQuizResponse> & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "generation failed");
      if (!data.questionId || !data.question || !data.topic || !data.difficulty) {
        throw new Error("generation returned incomplete payload");
      }
      setState({
        kind: "asking",
        questionId: data.questionId,
        difficulty: data.difficulty,
        topic: data.topic,
        question: data.question,
        options: data.options ?? null,
      });
    } catch (e) {
      setError(errMsg(e));
      setState({ kind: "idle" });
    }
  }

  async function submit(args: { userAnswer?: string; selectedIndex?: number }) {
    if (state.kind !== "asking") return;
    setError(null);
    const prev = state;
    setState({
      kind: "grading",
      questionId: state.questionId,
      difficulty: state.difficulty,
      topic: state.topic,
      question: state.question,
      options: state.options,
    });
    try {
      const res = await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          questionId: prev.questionId,
          ...(args.selectedIndex !== undefined
            ? { selectedIndex: args.selectedIndex }
            : { userAnswer: args.userAnswer ?? "" }),
        }),
      });
      const data = (await res.json()) as Partial<GradeResponse> & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "grading failed");

      // Compute displayable userAnswer for the reveal screen.
      const displayedAnswer =
        args.selectedIndex !== undefined && prev.options
          ? prev.options[args.selectedIndex]
          : (args.userAnswer ?? "");

      setState({
        kind: "revealed",
        difficulty: prev.difficulty,
        topic: prev.topic,
        question: prev.question,
        userAnswer: displayedAnswer,
        result: data.result ?? null,
        thoughtfulnessScore: data.thoughtfulnessScore ?? null,
        grade: data.grade ?? null,
        answerKey: data.answerKey ?? "",
      });
      // Refresh the server component so the new question shows in the log.
      router.refresh();
    } catch (e) {
      setError(errMsg(e));
      setState(prev);
    }
  }

  function reset() {
    setState({ kind: "idle" });
    setAnswer("");
    setShowAnswerKey(false);
    setError(null);
  }

  return (
    <section className="mx-auto mt-6 mb-20 w-full max-w-3xl px-4 sm:mt-10 sm:mb-24">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-6 shadow-[0_0_40px_var(--color-accent-glow)] sm:p-8">
        {state.kind === "idle" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                Ask Ash
              </h3>
              {interests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTopic((v) => !v)}
                  className="text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                >
                  Topic: {topic || "random"} {showTopic ? "▴" : "▾"}
                </button>
              )}
            </div>

            <p className="font-display mb-6 text-2xl leading-tight font-semibold text-[var(--color-text)] sm:text-3xl">
              Pick your difficulty. Ash writes the question.
            </p>

            <div className="flex flex-wrap gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => startQuiz(d)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
                >
                  {difficultyLabels[d]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => startQuiz("xhard")}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:border-red-500/70 hover:bg-red-500/20"
              >
                xHard →
              </button>
            </div>

            {showTopic && interests.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                <div className="mb-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  Pick a topic
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTopic("")}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      topic === ""
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-accent-dim)]"
                    }`}
                  >
                    random
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopic("discover")}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      topic === "discover"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-accent-dim)]"
                    }`}
                    title="Ash picks a fresh topic you haven't been quizzed on"
                  >
                    discover
                  </button>
                  {interests.map((i) => (
                    <button
                      key={i.name}
                      type="button"
                      onClick={() => setTopic(i.name)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        topic === i.name
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-accent-dim)]"
                      }`}
                    >
                      {i.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        )}

        {state.kind === "loading" && (
          <div aria-busy="true">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
              <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                Ash is writing a question…
              </span>
            </div>

            <div
              className="shimmer mb-3 h-9 w-5/6 rounded sm:h-10"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="shimmer mb-3 h-9 w-3/4 rounded sm:h-10"
              style={{ animationDelay: "0.15s" }}
            />
            <div
              className="shimmer h-9 w-2/5 rounded sm:h-10"
              style={{ animationDelay: "0.3s" }}
            />
          </div>
        )}

        {(state.kind === "asking" || state.kind === "grading") && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ${difficultyAccent[state.difficulty]}`}
              >
                {difficultyLabels[state.difficulty]}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-dim)]">
                {state.topic}
              </span>
            </div>

            <p className="font-display mb-5 text-2xl leading-snug font-semibold text-[var(--color-text)] sm:text-3xl">
              {state.question}
            </p>

            {/* Multiple-choice path: easy (2 opts) + medium (4 opts) */}
            {state.options ? (
              state.kind === "asking" ? (
                <div className="space-y-2">
                  {state.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => submit({ selectedIndex: i })}
                      className="group block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-accent-wash)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[0.7rem] font-semibold text-[var(--color-text-muted)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                  <div className="flex pt-1">
                    <button
                      type="button"
                      onClick={() => submit({})}
                      className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2 text-xs font-semibold text-[var(--color-text-dim)] transition-all hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
                    >
                      Skip
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                  Checking…
                </div>
              )
            ) : (
              /* Freeform path: hard, xhard, and legacy easy/medium without options */
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={state.kind === "grading"}
                  rows={state.difficulty === "xhard" ? 8 : 4}
                  placeholder={
                    state.difficulty === "xhard"
                      ? "propose your answer — take your time"
                      : "your answer"
                  }
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none disabled:opacity-60"
                />

                {state.kind === "asking" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => submit({ userAnswer: answer })}
                      disabled={answer.trim() === ""}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => submit({ userAnswer: "" })}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-dim)] transition-all hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
                    >
                      Skip
                    </button>
                    {error && (
                      <p className="mt-2 w-full text-sm text-red-400">{error}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                    Ash is grading…
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {state.kind === "revealed" && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ${difficultyAccent[state.difficulty]}`}
              >
                {difficultyLabels[state.difficulty]}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-dim)]">
                {state.topic}
              </span>
            </div>

            <p className="font-display mb-4 text-xl leading-snug font-semibold text-[var(--color-text)] sm:text-2xl">
              {state.question}
            </p>

            {state.userAnswer ? (
              <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                    Your answer
                  </div>
                  {state.thoughtfulnessScore !== null ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent-glow)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--color-accent)]">
                      {state.thoughtfulnessScore}/5 thoughtfulness
                    </span>
                  ) : state.result ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold uppercase ${resultStyles[state.result]}`}
                    >
                      {resultLabels[state.result]}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm whitespace-pre-wrap text-[var(--color-text-dim)]">
                  {state.userAnswer}
                </p>
              </div>
            ) : state.result ? (
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold uppercase ${resultStyles[state.result]}`}
                >
                  {resultLabels[state.result]}
                </span>
              </div>
            ) : null}

            {state.grade && (
              <div className="mb-4 rounded-lg border border-[var(--color-accent-dim)]/40 bg-[var(--color-accent-wash)] p-4">
                <div className="mb-1 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
                  Ash's grade
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-text)]">
                  {state.grade}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAnswerKey((v) => !v)}
              className="text-xs font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase transition-colors hover:text-[var(--color-accent)]"
            >
              {showAnswerKey ? "Hide answer key" : "Show answer key"}
            </button>
            {showAnswerKey && (
              <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-text-dim)]">
                  {state.answerKey}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                Ask another →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
