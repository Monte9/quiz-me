import { getAllUsers, getUser, getAllUsernames } from "@/lib/users";
import { UserSwitcher } from "@/components/UserSwitcher";
import { UserDashboard } from "@/components/UserDashboard";
import { ClaimStub } from "@/components/ClaimStub";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllUsernames()
    .filter((u) => u !== "monte")
    .map((user) => ({ user }));
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user: username } = await params;
  const user = getUser(username);
  if (!user) notFound();

  const users = getAllUsers();
  const claimed = user.claimedAt !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />
      <UserSwitcher users={users} activeUsername={username} />
      <div className="flex-1">
        {claimed ? (
          <UserDashboard user={user} />
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
