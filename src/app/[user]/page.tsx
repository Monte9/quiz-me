import { getUser } from "@/lib/users";
import { UserDashboard } from "@/components/UserDashboard";
import { ClaimStub } from "@/components/ClaimStub";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ user: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { user: username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const user = await getUser(username);
  if (!user) notFound();

  const claimed = user.claimedAt !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar compact />

      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase transition-colors hover:text-[var(--color-accent)]"
        >
          ← All users
        </Link>
      </div>

      <div className="flex-1">
        {claimed ? (
          <UserDashboard user={user} page={page} />
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
