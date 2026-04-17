import { getAllUsers, getUser, getAllUsernames } from "@/lib/users";
import { UserSwitcher } from "@/components/UserSwitcher";
import { UserDashboard } from "@/components/UserDashboard";
import { ClaimStub } from "@/components/ClaimStub";
import Link from "next/link";
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
    <div className="min-h-screen">
      <div className="pt-8">
        <h1 className="text-center text-xs font-semibold tracking-[0.3em] text-[var(--color-accent-dim)] uppercase">
          <Link href="/" className="hover:text-[var(--color-accent)]">
            Quiz Me
          </Link>
        </h1>
      </div>
      <UserSwitcher users={users} activeUsername={username} />
      {claimed ? (
        <UserDashboard user={user} />
      ) : (
        <ClaimStub
          displayName={user.displayName}
          inviteCode={user.inviteCode}
        />
      )}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        Built by the{" "}
        <a
          href="https://github.com/ashokosnexus"
          className="text-[var(--color-accent-dim)] hover:text-[var(--color-accent)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ash + Monte
        </a>{" "}
        dyad
      </footer>
    </div>
  );
}
