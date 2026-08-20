import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { getMembers } from "@/lib/groups";
import { listItems } from "@/lib/shopping";
import { ShoppingClient } from "./ShoppingClient";

export const dynamic = "force-dynamic";

export default async function ShoppingPage({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    const ctx = await requireMember(params.groupId);
    const [items, members] = await Promise.all([
      listItems(ctx.group.id),
      getMembers(ctx.group.id),
    ]);
    return (
      <ShoppingClient
        groupId={ctx.group.id}
        meId={ctx.user.id}
        members={members}
        initial={items}
      />
    );
  } catch {
    notFound();
  }
}
