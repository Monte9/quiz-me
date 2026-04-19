import { getAllUsers } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { UserCard, JoinCard } from "@/components/UserCard";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getAllUsers();

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-10 pb-16">
        <div className="mb-12 text-center">
          <h1 className="font-display mb-3 text-5xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
            Users
          </h1>
          <p className="mx-auto max-w-xl text-base text-[var(--color-text-dim)]">
            Everyone who's getting quizzed. Click through to see their public log.
          </p>
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
