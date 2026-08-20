import { z } from "zod";
import { db } from "@/lib/db";
import { shoppingItems } from "@/lib/db/schema";
import { requireMember } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { listItems } from "@/lib/shopping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { groupId: string } };

export const GET = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  return json(await listItems(ctx.group.id));
});

const CreateInput = z.object({
  title: z.string().trim().min(1, "What are we buying?").max(120),
  notes: z.string().trim().max(300).optional().nullable(),
});

export const POST = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const input = CreateInput.parse(await body(req));

  await db.insert(shoppingItems).values({
    groupId: ctx.group.id,
    title: input.title,
    notes: input.notes || null,
    addedBy: ctx.user.id,
  });

  return json(await listItems(ctx.group.id), 201);
});
