import { getAllUsers, getUser } from "@/lib/users";
import { computeRank } from "@/lib/quiz-core";
import { UserDashboard } from "@/components/UserDashboard";
import { ClaimStub } from "@/components/ClaimStub";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { notFound } from "next/navigation";

export default async function UserPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user: username } = await params;
  const [user, allUsers] = await Promise.all([getUser(username), getAllUsers()]);
  if (!user) notFound();

  const claimed = user.claimedAt !== null;
  const claimedUsers = allUsers.filter((u) => u.claimedAt !== null);
  const { rank, total } = computeRank(claimedUsers, user.username);

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <div className="flex-1">
        {claimed ? (
          <UserDashboard user={user} rank={rank} rankTotal={total} />
        ) : (
          <ClaimStub
            displayName={user.displayName}
            inviteCode={user.inviteCode}
          />
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
