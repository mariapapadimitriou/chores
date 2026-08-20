import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { listMyGroups } from "@/lib/groups";
import { Logo } from "@/components/Logo";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.onboardedAt) redirect("/onboarding");

  const groups = await listMyGroups(user.id);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-ink/10 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/app" aria-label="Chorella home">
            <Logo size={26} />
          </Link>
          <TopBar
            me={{
              id: user.id,
              name: user.name,
              emoji: user.emoji,
              color: user.color,
            }}
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          />
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}
