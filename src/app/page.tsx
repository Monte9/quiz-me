import { getAllUsers, getUser } from "@/lib/users";
import { UserSwitcher } from "@/components/UserSwitcher";
import { UserDashboard } from "@/components/UserDashboard";
import { notFound } from "next/navigation";

export default function Home() {
  const users = getAllUsers();
  const monte = getUser("monte");
  if (!monte) notFound();

  return (
    <div className="min-h-screen">
      <div className="pt-8">
        <h1 className="text-center text-xs font-semibold tracking-[0.3em] text-[var(--color-accent-dim)] uppercase">
          Quiz Me
        </h1>
      </div>
      <UserSwitcher users={users} activeUsername="monte" />
      <UserDashboard user={monte} />
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
