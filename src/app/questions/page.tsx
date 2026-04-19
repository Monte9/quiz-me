import Link from "next/link";
import { getAllQuestions, getAllTopics } from "@/lib/users";
import type { Difficulty } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { QuestionList } from "@/components/QuestionList";
import { QuestionFilters } from "@/components/QuestionFilters";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "xhard"];

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    difficulty?: string;
    topic?: string;
    page?: string;
  }>;
}) {
  const {
    difficulty: rawDiff,
    topic: rawTopic,
    page: rawPage,
  } = await searchParams;

  const difficulty: Difficulty | null = VALID_DIFFICULTIES.includes(
    rawDiff as Difficulty,
  )
    ? (rawDiff as Difficulty)
    : null;
  const topic = rawTopic?.trim() || null;
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const [all, topics] = await Promise.all([getAllQuestions(), getAllTopics()]);

  let filtered = all;
  if (difficulty) {
    filtered = filtered.filter((q) => q.difficulty === difficulty);
  }
  if (topic) {
    filtered = filtered.filter((q) => q.topic === topic);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilter = difficulty !== null || topic !== null;

  const filteredTopics = new Set<string>();
  let gradedCount = 0;
  let correctCount = 0;
  for (const q of filtered) {
    filteredTopics.add(q.topic);
    if (q.result && q.result !== "skipped") {
      gradedCount++;
      if (q.result === "correct") correctCount++;
    }
  }
  const correctRate =
    gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : null;

  const tiles: { value: string; label: string; accent?: boolean }[] = [
    { value: String(filtered.length), label: "Questions" },
    { value: String(filteredTopics.size), label: "Topics" },
    {
      value: correctRate !== null ? `${correctRate}%` : "—",
      label: "Correct",
      accent: true,
    },
  ];

  function buildPageHref(p: number): string {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (topic) params.set("topic", topic);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/questions?${qs}` : "/questions";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-10 pb-16">
        <div className="mb-10 text-center">
          <h1 className="font-display mb-3 text-5xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
            Questions
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base text-[var(--color-text-dim)]">
            Every question Ash has ever asked. Filter by difficulty or topic.
          </p>

          <div className="mx-auto grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="bg-[var(--color-bg-raised)] px-4 py-6"
              >
                <div
                  className={`font-display text-4xl leading-none font-semibold tracking-tight sm:text-5xl ${
                    t.accent
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text)]"
                  }`}
                >
                  {t.value}
                </div>
                <div className="mt-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <QuestionFilters
          topics={topics}
          difficulty={difficulty}
          topic={topic}
        />

        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
            {hasActiveFilter ? "Matching" : "All questions"}
          </h3>
          <span className="text-xs text-[var(--color-text-muted)]">
            {filtered.length} {filtered.length === 1 ? "question" : "questions"}
          </span>
        </div>

        <QuestionList
          items={items}
          emptyMessage={
            hasActiveFilter
              ? "No questions match these filters."
              : "No questions yet."
          }
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildPageHref}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
