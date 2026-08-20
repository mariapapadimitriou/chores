import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { completions, reactions } from "@/lib/db/schema";
import { requireMember, isUuid, HttpError } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: { groupId: string; completionId: string } };

// A fixed set keeps the feed tidy and stops the column being a free-text sink.
const ALLOWED = ["👏", "💛", "🙏", "🔥", "😅"] as const;
const Input = z.object({ emoji: z.enum(ALLOWED) });

/** Confirm the completion is real and belongs to this group. */
async function completionInGroup(groupId: string, completionId: string) {
  if (!isUuid(completionId)) throw new HttpError(404, "Entry not found.");
  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .where(and(eq(completions.id, completionId), eq(completions.groupId, groupId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Entry not found.");
  return row;
}

export const POST = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  await completionInGroup(ctx.group.id, params.completionId);
  const { emoji } = Input.parse(await body(req));

  await db
    .insert(reactions)
    .values({ completionId: params.completionId, userId: ctx.user.id, emoji })
    // Reacting twice with the same emoji is a no-op, not an error.
    .onConflictDoNothing();

  return json({ ok: true }, 201);
});

export const DELETE = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  await completionInGroup(ctx.group.id, params.completionId);
  const { emoji } = Input.parse(await body(req));

  await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.completionId, params.completionId),
        // Only ever your own reaction.
        eq(reactions.userId, ctx.user.id),
        eq(reactions.emoji, emoji)
      )
    );

  return json({ ok: true });
});
