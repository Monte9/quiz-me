import Link from "next/link";
import { getAllUsers, getUser } from "@/lib/users";
import { AskMePanel } from "@/components/AskMePanel";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { QuestionList } from "@/components/QuestionList";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getAllUsers();
  const monte = await getUser("monte");
  if (!monte) notFound();

  const totalQuestions = users.reduce((n, u) => n + u.questions.length, 0);
  const topicSet = new Set<string>();
  for (const u of users) {
    for (const i of u.interests) topicSet.add(i.name);
    for (const q of u.questions) topicSet.add(q.topic);
  }

  const tiles: {
    value: number;
    label: string;
    href: string | null;
  }[] = [
    { value: users.length, label: "Users", href: "/users" },
    { value: totalQuestions, label: "Questions", href: "/questions" },
    { value: topicSet.size, label: "Topics", href: null },
  ];

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

      <section className="mx-auto w-full max-w-xl px-6 pb-16">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
          {tiles.map((t) => {
            const inner = (
              <>
                <div className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-accent)] sm:text-5xl">
                  {t.value}
                </div>
                <div className="mt-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  {t.label}
                </div>
              </>
            );
            const cls =
              "block bg-[var(--color-bg-raised)] px-4 py-6 text-center";
            if (t.href) {
              return (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`${cls} transition-colors hover:bg-[var(--color-bg-hover,var(--color-bg-raised))] hover:text-[var(--color-accent-bright)]`}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div key={t.label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
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

      <SiteFooter />
    </div>
  );
}
