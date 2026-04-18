import { getAllUsers } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { UserCard, JoinCard } from "@/components/UserCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getAllUsers();

  const totalQuestions = users.reduce((n, u) => n + u.questions.length, 0);
  const topicSet = new Set<string>();
  for (const u of users) {
    for (const i of u.interests) topicSet.add(i.name);
    for (const q of u.questions) topicSet.add(q.topic);
  }

  const tiles: { value: number; label: string }[] = [
    { value: users.length, label: "Users" },
    { value: totalQuestions, label: "Questions" },
    { value: topicSet.size, label: "Topics" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-10 pb-16">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase transition-colors hover:text-[var(--color-accent)]"
          >
            ← Home
          </Link>
          <h1 className="font-display mb-3 text-5xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
            Users
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base text-[var(--color-text-dim)]">
            Everyone who's getting quizzed. Click through to see their public log.
          </p>

          <div className="mx-auto grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="bg-[var(--color-bg-raised)] px-4 py-6"
              >
                <div className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-accent)] sm:text-5xl">
                  {t.value}
                </div>
                <div className="mt-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <UserCard key={u.username} user={u} />
          ))}
          <JoinCard />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
