import { getAllUsers } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { StatsSection } from "@/components/StatsSection";
import { PillarCards } from "@/components/PillarCards";
import { RecapCTA } from "@/components/RecapCTA";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getAllUsers();

  const totalQuestions = users.reduce((n, u) => n + u.questions.length, 0);
  const topicSet = new Set<string>();
  for (const u of users) {
    for (const i of u.interests) topicSet.add(i.name);
    for (const q of u.questions) topicSet.add(q.topic);
  }

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

      <RecapCTA />

      <SiteFooter />
    </div>
  );
}
