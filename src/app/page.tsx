import Link from "next/link";
import { getAllUsers } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { StatsSection } from "@/components/StatsSection";
import { PillarCards } from "@/components/PillarCards";
import { RecapCTA } from "@/components/RecapCTA";
import { QuestionList } from "@/components/QuestionList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getAllUsers();

  const totalQuestions = users.reduce((n, u) => n + u.questions.length, 0);
  const topicSet = new Set<string>();
  for (const u of users) {
    for (const i of u.interests) topicSet.add(i.name);
    for (const q of u.questions) topicSet.add(q.topic);
  }

  const recent = users
    .flatMap((u) => u.questions)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <Hero />

      <StatsSection
        users={users.length}
        questions={totalQuestions}
        topics={topicSet.size}
      />

      <PillarCards />

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-24">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              Recent questions
            </h3>
            <Link
              href="/questions"
              className="text-xs font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase transition-colors hover:text-[var(--color-accent)]"
            >
              See all →
            </Link>
          </div>
          <QuestionList items={recent} />
        </section>
      )}

      <RecapCTA />

      <SiteFooter />
    </div>
  );
}
