import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { completions } from "@/lib/db/schema";
import { requireMember, isUuid, HttpError } from "@/lib/auth-guard";
import { handle, json } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: { groupId: string; completionId: string } };

/** Undo a completion. Anyone in the group can correct the record. */
export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  if (!isUuid(params.completionId)) throw new HttpError(404, "Entry not found.");

  const [removed] = await db
    .delete(completions)
    .where(
      and(
        eq(completions.id, params.completionId),
        // Scope to the group so an id from another household can't be deleted.
        eq(completions.groupId, ctx.group.id)
      )
    )
    .returning({ id: completions.id });

  if (!removed) throw new HttpError(404, "Entry not found.");
  return json({ ok: true });
});
