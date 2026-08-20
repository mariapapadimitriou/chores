import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { requireMember, requireOwner } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { getGroup, getChores, weekTally } from "@/lib/groups";
import { inviteCode } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { groupId: string } };

export const GET = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const [group, chores, tally] = await Promise.all([
    getGroup(ctx.group.id, ctx.membership.role),
    getChores(ctx.group.id),
    weekTally(ctx.group.id),
  ]);
  return json({ group, chores, weekTally: tally, updatedAt: Date.now() });
});

const PatchInput = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  regenerateInviteCode: z.boolean().optional(),
});

export const PATCH = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireOwner(params.groupId);
  const input = PatchInput.parse(await body(req));

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.regenerateInviteCode) patch.inviteCode = inviteCode();

  if (Object.keys(patch).length) {
    await db.update(groups).set(patch).where(eq(groups.id, ctx.group.id));
  }

  return json(await getGroup(ctx.group.id, ctx.membership.role));
});

export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireOwner(params.groupId);
  // Chores, completions, memberships, reactions and shopping items all
  // cascade from groups — see lib/db/schema.ts.
  await db.delete(groups).where(eq(groups.id, ctx.group.id));
  return json({ ok: true });
});
