import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shoppingItems } from "@/lib/db/schema";
import { requireMember, isUuid, HttpError } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { listItems } from "@/lib/shopping";

export const runtime = "nodejs";

type Params = { params: { groupId: string; itemId: string } };

const PatchInput = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(300).nullable().optional(),
  bought: z.boolean().optional(),
});

async function itemInGroup(groupId: string, itemId: string) {
  if (!isUuid(itemId)) throw new HttpError(404, "Item not found.");
  const [row] = await db
    .select()
    .from(shoppingItems)
    .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.groupId, groupId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Item not found.");
  return row;
}

export const PATCH = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const existing = await itemInGroup(ctx.group.id, params.itemId);
  const input = PatchInput.parse(await body(req));

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.notes !== undefined) patch.notes = input.notes || null;
  if (input.bought !== undefined) {
    // Who bought it comes from the session, so the credit is always honest.
    patch.boughtBy = input.bought ? ctx.user.id : null;
    patch.boughtAt = input.bought ? new Date() : null;
  }

  if (Object.keys(patch).length) {
    await db.update(shoppingItems).set(patch).where(eq(shoppingItems.id, existing.id));
  }
  return json(await listItems(ctx.group.id));
});

export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const existing = await itemInGroup(ctx.group.id, params.itemId);
  await db.delete(shoppingItems).where(eq(shoppingItems.id, existing.id));
  return json(await listItems(ctx.group.id));
});
