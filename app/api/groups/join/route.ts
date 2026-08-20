import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, memberships } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { normalizeInviteCode } from "@/lib/ids";

export const runtime = "nodejs";

const Input = z.object({ code: z.string().min(1, "Enter an invite code.") });

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const code = normalizeInviteCode(Input.parse(await body(req)).code);

  const [group] = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.inviteCode, code))
    .limit(1);

  if (!group) return json({ error: "No group has that invite code." }, 404);

  const [already] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.groupId, group.id), eq(memberships.userId, user.id)))
    .limit(1);

  if (already) return json({ id: group.id, name: group.name, alreadyMember: true });

  await db.insert(memberships).values({
    groupId: group.id,
    userId: user.id,
    role: "member",
  });

  return json({ id: group.id, name: group.name, alreadyMember: false }, 201);
});
