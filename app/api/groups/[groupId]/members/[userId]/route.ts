import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
import { requireOwner, isUuid, HttpError } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { getMembers } from "@/lib/groups";

export const runtime = "nodejs";

type Params = { params: { groupId: string; userId: string } };

const PatchInput = z.object({ role: z.enum(["owner", "member"]) });

/** Promote or demote a member. Owner only. */
export const PATCH = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireOwner(params.groupId);
  if (!isUuid(params.userId)) throw new HttpError(404, "No such member.");
  const { role } = PatchInput.parse(await body(req));

  if (params.userId === ctx.user.id && role === "member") {
    return json({ error: "Promote someone else to owner first." }, 409);
  }

  const [updated] = await db
    .update(memberships)
    .set({ role })
    .where(
      and(eq(memberships.groupId, ctx.group.id), eq(memberships.userId, params.userId))
    )
    .returning({ id: memberships.id });

  if (!updated) throw new HttpError(404, "That person is not in this group.");
  return json(await getMembers(ctx.group.id));
});

/** Remove a member. Owner only, and never yourself — use /leave for that. */
export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireOwner(params.groupId);
  if (!isUuid(params.userId)) throw new HttpError(404, "No such member.");

  if (params.userId === ctx.user.id) {
    return json({ error: "Use “leave group” to remove yourself." }, 409);
  }

  const [removed] = await db
    .delete(memberships)
    .where(
      and(eq(memberships.groupId, ctx.group.id), eq(memberships.userId, params.userId))
    )
    .returning({ id: memberships.id });

  if (!removed) throw new HttpError(404, "That person is not in this group.");
  return json(await getMembers(ctx.group.id));
});
