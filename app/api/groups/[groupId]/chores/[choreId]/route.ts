import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chores } from "@/lib/db/schema";
import {
  requireMember,
  assertMemberOfGroup,
  isUuid,
  HttpError,
} from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { getChores } from "@/lib/groups";

export const runtime = "nodejs";

type Params = { params: { groupId: string; choreId: string } };

const PatchInput = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  cadence: z.enum(["once", "daily", "weekly", "monthly"]).optional(),
  assignment: z.enum(["anyone", "fixed", "rotate"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  snoozedUntil: z.number().int().positive().nullable().optional(),
});

/** Confirm the chore exists AND belongs to this group before touching it. */
async function choreInGroup(groupId: string, choreId: string) {
  if (!isUuid(choreId)) throw new HttpError(404, "Chore not found.");
  const [row] = await db
    .select()
    .from(chores)
    .where(and(eq(chores.id, choreId), eq(chores.groupId, groupId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Chore not found.");
  return row;
}

export const PATCH = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const existing = await choreInGroup(ctx.group.id, params.choreId);
  const input = PatchInput.parse(await body(req));

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.notes !== undefined) patch.notes = input.notes || null;
  if (input.cadence !== undefined) patch.cadence = input.cadence;
  if (input.snoozedUntil !== undefined) {
    patch.snoozedUntil = input.snoozedUntil ? new Date(input.snoozedUntil) : null;
  }

  // assignment and assigneeId move together: only "fixed" keeps a person.
  const assignment = input.assignment ?? existing.assignment;
  if (input.assignment !== undefined) patch.assignment = input.assignment;
  if (input.assignment !== undefined || input.assigneeId !== undefined) {
    if (assignment === "fixed") {
      const id = input.assigneeId ?? existing.assigneeId ?? null;
      if (id) await assertMemberOfGroup(ctx.group.id, id);
      patch.assigneeId = id;
    } else {
      patch.assigneeId = null;
    }
  }

  if (Object.keys(patch).length) {
    await db.update(chores).set(patch).where(eq(chores.id, existing.id));
  }
  return json(await getChores(ctx.group.id));
});

export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const existing = await choreInGroup(ctx.group.id, params.choreId);
  // completions.choreId is SET NULL, so the history of who did this survives.
  await db.delete(chores).where(eq(chores.id, existing.id));
  return json(await getChores(ctx.group.id));
});
