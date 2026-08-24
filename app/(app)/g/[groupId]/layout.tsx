import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { GroupNav } from "@/components/GroupNav";

export const dynamic = "force-dynamic";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  // The authorization boundary for everything under /g/[groupId]. A non-member
  // gets a 404 page, not someone else's household.
  let name: string;
  try {
    const ctx = await requireMember(params.groupId);
    name = ctx.group.name;
  } catch {
    notFound();
  }

  return (
    <div>
      <header className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-fg/60">Group</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
      </header>
      <GroupNav groupId={params.groupId} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
