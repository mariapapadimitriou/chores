import { z } from "zod";
import { requireUser } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { listMyGroups, createGroup } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireUser();
  return json(await listMyGroups(user.id));
});

const CreateInput = z.object({
  name: z.string().trim().min(1, "Give the group a name.").max(60),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const { name } = CreateInput.parse(await body(req));
  const groupId = await createGroup(user.id, name);
  return json({ id: groupId }, 201);
});
