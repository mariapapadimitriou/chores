import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chores, completions } from "@/lib/db/schema";
import { requireMember, isUuid, HttpError } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { getChores } from "@/lib/groups";

export const runtime = "nodejs";

type Params = { params: { groupId: string; choreId: string } };

const Input = z.object({
  note: z.string().trim().max(280).optional().nullable(),
});

export const POST = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  if (!isUuid(params.choreId)) throw new HttpError(404, "Chore not found.");

  const [chore] = await db
    .select()
    .from(chores)
    .where(and(eq(chores.id, params.choreId), eq(chores.groupId, ctx.group.id)))
    .limit(1);
  if (!chore) throw new HttpError(404, "Chore not found.");

  const { note } = Input.parse(await body(req));

  await db.insert(completions).values({
    groupId: ctx.group.id,
    choreId: chore.id,
    // Snapshot: keeps the feed readable if the chore is later renamed or deleted.
    choreTitle: chore.title,
    // Attribution comes from the session, never the request body — otherwise
    // anyone could log a chore as someone else.
    userId: ctx.user.id,
    note: note || null,
  });

  // Doing a chore ends any snooze on it.
  if (chore.snoozedUntil) {
    await db.update(chores).set({ snoozedUntil: null }).where(eq(chores.id, chore.id));
  }

  return json(await getChores(ctx.group.id), 201);
});
