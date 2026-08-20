import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { getGroup } from "@/lib/groups";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    const ctx = await requireMember(params.groupId);
    const group = await getGroup(ctx.group.id, ctx.membership.role);
    return <SettingsClient meId={ctx.user.id} initial={group} />;
  } catch {
    notFound();
  }
}
