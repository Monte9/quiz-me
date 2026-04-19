"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  computeContextStats,
  recentTopics,
  type Difficulty,
  type Interest,
  type Question,
  type Result,
} from "@/lib/quiz-core";

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

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "xhard"];

const difficultyLabels: Record<Difficulty, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
  xhard: "xhard",
};

const difficultyBadge: Record<Difficulty, string> = {
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

const resultCardStyles: Record<Result, string> = {
  correct: "border-emerald-500/40 bg-emerald-500/10",
  partial: "border-amber-500/40 bg-amber-500/10",
  wrong: "border-red-500/40 bg-red-500/10",
  skipped: "border-zinc-500/30 bg-zinc-500/5",
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

function topicLabel(topic: string): string {
  if (topic === "") return "a random topic";
  if (topic === "discover") return "a fresh topic";
  return topic;
}

function trendGlyph(trend: "up" | "down" | "flat" | null): string {
  if (trend === "up") return " ↑";
  if (trend === "down") return " ↓";
  return "";
}

export function AskMePanel({
  username,
  interests,
  questions,
}: {
  username: string;
  interests: Interest[];
  questions: Question[];
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showTopic, setShowTopic] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate last choice from localStorage once on mount.
  useEffect(() => {
    try {
      const t = localStorage.getItem(`qm-last-topic:${username}`);
      const d = localStorage.getItem(
        `qm-last-difficulty:${username}`,
      ) as Difficulty | null;
      if (t !== null) setTopic(t);
      if (d && DIFFICULTIES.includes(d)) setDifficulty(d);
    } catch {
      // ignore (private mode, quota, etc.)
    }
  }, [username]);

  // Close floating menus on outside click.
  const topicRef = useRef<HTMLDivElement | null>(null);
  const diffRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (topicRef.current && !topicRef.current.contains(t)) {
        setShowTopic(false);
      }
      if (diffRef.current && !diffRef.current.contains(t)) {
        setShowDifficulty(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function persistTopic(next: string) {
    setTopic(next);
    try {
      localStorage.setItem(`qm-last-topic:${username}`, next);
    } catch {
      // ignore
    }
  }

  function persistDifficulty(next: Difficulty) {
    setDifficulty(next);
    try {
      localStorage.setItem(`qm-last-difficulty:${username}`, next);
    } catch {
      // ignore
    }
  }

  async function startQuiz() {
    setError(null);
    setAnswer("");
    setShowAnswerKey(false);
    setShowTopic(false);
    setShowDifficulty(false);
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
      // Auto-open the answer key on MC reveals so users learn from it.
      // Freeform (hard/xhard) keeps it collapsed — the grade carries
      // most of the signal there and the key can be long.
      setShowAnswerKey(prev.options !== null);
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

  // Subtitle copy branches for the idle state.
  const ctx = computeContextStats(questions, topic, difficulty);
  const subtitle = buildSubtitle(topic, difficulty, ctx);

  const recent = recentTopics(
    questions,
    interests.map((i) => i.name),
    3,
  );

  return (
    <section
      id="ask"
      className="mx-auto mt-6 mb-20 w-full max-w-3xl scroll-mt-24 px-4 sm:mt-10 sm:mb-24"
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-6 shadow-[0_0_40px_var(--color-accent-glow)] sm:p-8">
        {state.kind === "idle" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                Ask Ash
              </h3>
            </div>

            <p className="font-display mb-3 text-2xl leading-snug font-semibold text-[var(--color-text)] sm:text-3xl">
              <span className="block">Quizzing you on</span>
              <span className="block">
                <span className="relative inline-block" ref={topicRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopic((v) => !v);
                      setShowDifficulty(false);
                    }}
                    className="text-[var(--color-accent)] decoration-dotted underline-offset-[6px] transition-colors hover:text-[var(--color-accent-bright)] hover:underline"
                    aria-expanded={showTopic}
                    aria-haspopup="listbox"
                  >
                    {topicLabel(topic)}
                    <span className="ml-1 text-sm text-[var(--color-text-muted)]">
                      {showTopic ? "▴" : "▾"}
                    </span>
                  </button>
                  {/* Desktop dropdown (sm+) */}
                  {showTopic && (
                    <div
                      role="listbox"
                      className="absolute top-full left-1/2 z-20 mt-2 hidden w-[22rem] -translate-x-1/2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-hover)] p-3 text-sm shadow-2xl ring-1 ring-black/40 sm:block"
                    >
                      <TopicPickerContent
                        topic={topic}
                        interests={interests}
                        recent={recent}
                        onPick={(next) => {
                          persistTopic(next);
                          setShowTopic(false);
                        }}
                      />
                    </div>
                  )}
                </span>{" "}
                with
              </span>
              <span className="block">
                <span className="relative inline-block" ref={diffRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDifficulty((v) => !v);
                      setShowTopic(false);
                    }}
                    className="text-[var(--color-accent)] decoration-dotted underline-offset-[6px] transition-colors hover:text-[var(--color-accent-bright)] hover:underline"
                    aria-expanded={showDifficulty}
                    aria-haspopup="listbox"
                  >
                    {difficultyLabels[difficulty]}
                    <span className="ml-1 text-sm text-[var(--color-text-muted)]">
                      {showDifficulty ? "▴" : "▾"}
                    </span>
                  </button>
                  {showDifficulty && (
                    <div
                      role="listbox"
                      className="absolute top-full left-1/2 z-20 mt-2 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-hover)] p-1 text-sm shadow-2xl ring-1 ring-black/40"
                    >
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          role="option"
                          aria-selected={difficulty === d}
                          onClick={() => {
                            persistDifficulty(d);
                            setShowDifficulty(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                            difficulty === d
                              ? "bg-[var(--color-accent-wash)] text-[var(--color-accent)]"
                              : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface)]"
                          }`}
                        >
                          <span className="font-medium">
                            {difficultyLabels[d]}
                          </span>
                          <DifficultyHint d={d} />
                        </button>
                      ))}
                    </div>
                  )}
                </span>{" "}
                difficulty.
              </span>
            </p>

            {/* Mobile bottom-sheet topic picker */}
            {showTopic && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Pick a topic"
                className="fixed inset-0 z-40 flex items-end sm:hidden"
              >
                <div
                  className="absolute inset-0 bg-black/70"
                  onClick={() => setShowTopic(false)}
                  aria-hidden
                />
                <div className="relative max-h-[85vh] w-full overflow-auto rounded-t-2xl border-x border-t border-[var(--color-border-strong)] bg-[var(--color-surface-hover)] p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                      Pick a topic
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowTopic(false)}
                      aria-label="Close"
                      className="text-lg text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      ✕
                    </button>
                  </div>
                  <TopicPickerContent
                    topic={topic}
                    interests={interests}
                    recent={recent}
                    onPick={(next) => {
                      persistTopic(next);
                      setShowTopic(false);
                    }}
                    hideHeading
                  />
                </div>
              </div>
            )}

            {subtitle && (
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">
                {subtitle}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startQuiz}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                Quiz me →
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
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
                {difficultyBadge[state.difficulty]}
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
                      <p className="mt-2 w-full text-sm text-red-400">
                        {error}
                      </p>
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
                {difficultyBadge[state.difficulty]}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-dim)]">
                {state.topic}
              </span>
            </div>

            <p className="font-display mb-4 text-xl leading-snug font-semibold text-[var(--color-text)] sm:text-2xl">
              {state.question}
            </p>

            {state.userAnswer ? (
              <div
                className={`mb-4 rounded-lg border p-4 ${
                  state.result
                    ? resultCardStyles[state.result]
                    : "border-[var(--color-border)] bg-[var(--color-surface)]/60"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
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
                  <div className="text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                    Your answer
                  </div>
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

function TopicPickerContent({
  topic,
  interests,
  recent,
  onPick,
  hideHeading = false,
}: {
  topic: string;
  interests: Interest[];
  recent: string[];
  onPick: (name: string) => void;
  hideHeading?: boolean;
}) {
  return (
    <>
      {!hideHeading && (
        <div className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
          Pick a topic
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <TopicChip
          label="random"
          active={topic === ""}
          onClick={() => onPick("")}
        />
        <TopicChip
          label="discover"
          active={topic === "discover"}
          title="Ash picks a fresh topic you haven't been quizzed on"
          onClick={() => onPick("discover")}
        />
      </div>

      {interests.length > 0 && (
        <>
          <div className="mt-4 mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
            Your topics
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <TopicChip
                key={i.name}
                label={i.name}
                active={topic === i.name}
                onClick={() => onPick(i.name)}
              />
            ))}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <div className="mt-4 mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
            Recent
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((name) => (
              <TopicChip
                key={name}
                label={name}
                active={topic === name}
                onClick={() => onPick(name)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TopicChip({
  label,
  active,
  title,
  onClick,
}: {
  label: string;
  active: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-accent-dim)]"
      }`}
    >
      {label}
    </button>
  );
}

function DifficultyHint({ d }: { d: Difficulty }) {
  const label: Record<Difficulty, string> = {
    easy: "yes / no",
    medium: "4 choices",
    hard: "freeform",
    xhard: "research",
  };
  return (
    <span className="text-[0.65rem] text-[var(--color-text-muted)]">
      {label[d]}
    </span>
  );
}

function buildSubtitle(
  topic: string,
  difficulty: Difficulty,
  ctx: {
    total: number;
    graded: number;
    correctRate: number | null;
    trend: "up" | "down" | "flat" | null;
    xhardAvg: number | null;
    uniqueTopics: number;
  },
): string | null {
  const specific = topic !== "" && topic !== "discover";
  const isDiscover = topic === "discover";

  // Zero history in this slice: hide subtitle.
  if (ctx.total === 0) return null;

  // Discover mode surfaces breadth, not correctness.
  if (isDiscover) {
    return `${ctx.total} ${ctx.total === 1 ? "question" : "questions"} explored with Ash · ${ctx.uniqueTopics} ${
      ctx.uniqueTopics === 1 ? "topic" : "topics"
    }`;
  }

  // xhard is scored on thoughtfulness, not correctness.
  if (difficulty === "xhard") {
    if (specific) {
      if (ctx.xhardAvg !== null) {
        return `${ctx.total} xhard ${topic} ${ctx.total === 1 ? "question" : "questions"} · avg ${ctx.xhardAvg.toFixed(1)}/5 thoughtfulness`;
      }
      return `${ctx.total} xhard ${topic} ${ctx.total === 1 ? "question" : "questions"} so far`;
    }
    if (ctx.xhardAvg !== null) {
      return `${ctx.total} xhard ${ctx.total === 1 ? "question" : "questions"} · avg ${ctx.xhardAvg.toFixed(1)}/5 thoughtfulness`;
    }
    return `${ctx.total} xhard ${ctx.total === 1 ? "question" : "questions"} so far`;
  }

  // Specific topic, enough data for a rate.
  if (specific) {
    if (ctx.correctRate !== null) {
      return `You've answered ${ctx.total} ${topic} ${ctx.total === 1 ? "question" : "questions"} at ${difficultyLabels[difficulty]} · ${ctx.correctRate}% correct${trendGlyph(ctx.trend)}`;
    }
    return `${ctx.total} on ${topic} so far`;
  }

  // Random mode with enough graded history.
  if (ctx.correctRate !== null) {
    return `${ctx.total} answered across your topics at ${difficultyLabels[difficulty]} · ${ctx.correctRate}% correct${trendGlyph(ctx.trend)}`;
  }
  return `${ctx.total} answered across your topics so far`;
}
