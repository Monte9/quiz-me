import Link from "next/link";
import { getAllUsers, getUser } from "@/lib/users";
import { AskMePanel } from "@/components/AskMePanel";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { QuestionCard } from "@/components/QuestionCard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getAllUsers();
  const monte = await getUser("monte");
  if (!monte) notFound();

  const recent = users
    .flatMap((u) =>
      u.questions.map((q) => ({ username: u.username, question: q })),
    )
    .sort((a, b) => b.question.createdAt.localeCompare(a.question.createdAt))
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <Hero />

      <AskMePanel username={monte.username} interests={monte.interests} />

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              Recent questions
            </h3>
            <Link
              href="/users"
              className="text-xs font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase transition-colors hover:text-[var(--color-accent)]"
            >
              See all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map(({ username, question }) => (
              <QuestionCard
                key={question.id}
                username={username}
                q={question}
              />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
