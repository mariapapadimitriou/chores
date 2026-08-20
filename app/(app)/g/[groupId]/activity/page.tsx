import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { getMembers } from "@/lib/groups";
import { ActivityClient } from "./ActivityClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    const ctx = await requireMember(params.groupId);
    return (
      <ActivityClient
        groupId={ctx.group.id}
        meId={ctx.user.id}
        members={await getMembers(ctx.group.id)}
      />
    );
  } catch {
    notFound();
  }
}
