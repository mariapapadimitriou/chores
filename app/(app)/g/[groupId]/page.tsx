import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { getGroup, getChores, weekTally } from "@/lib/groups";
import { Board } from "./Board";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { groupId: string } }) {
  try {
    const ctx = await requireMember(params.groupId);
    const [group, chores, tally] = await Promise.all([
      getGroup(ctx.group.id, ctx.membership.role),
      getChores(ctx.group.id),
      weekTally(ctx.group.id),
    ]);
    return (
      <Board
        meId={ctx.user.id}
        initialGroup={group}
        initialChores={chores}
        initialTally={tally}
      />
    );
  } catch {
    notFound();
  }
}
