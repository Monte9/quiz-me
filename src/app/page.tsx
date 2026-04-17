import { getAllUsers, getUser } from "@/lib/users";
import { UserDashboard } from "@/components/UserDashboard";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
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

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <Hero
        users={users.length}
        totalQuestions={totalQuestions}
        totalTopics={topicSet.size}
      />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="flex-1">
          <UserDashboard user={monte} variant="compact" />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
