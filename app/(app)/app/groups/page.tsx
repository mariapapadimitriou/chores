import { requireUser } from "@/lib/auth-guard";
import { listMyGroups } from "@/lib/groups";
import { GroupsClient } from "./GroupsClient";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const user = await requireUser();
  return <GroupsClient initial={await listMyGroups(user.id)} />;
}
