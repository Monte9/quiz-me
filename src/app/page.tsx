import { getAllUsers, getUser } from "@/lib/users";
import { UserSwitcher } from "@/components/UserSwitcher";
import { UserDashboard } from "@/components/UserDashboard";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { notFound } from "next/navigation";

export default function Home() {
  const users = getAllUsers();
  const monte = getUser("monte");
  if (!monte) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />
      <UserSwitcher users={users} activeUsername="monte" />
      <div className="flex-1">
        <UserDashboard user={monte} />
      </div>
      <SiteFooter />
    </div>
  );
}
