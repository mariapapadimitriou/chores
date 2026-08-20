import { z } from "zod";
import { db } from "@/lib/db";
import { chores } from "@/lib/db/schema";
import { requireMember, assertMemberOfGroup } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import { getChores } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { groupId: string } };

export const GET = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  return json(await getChores(ctx.group.id));
});

const CreateInput = z.object({
  title: z.string().trim().min(1, "Give the chore a name.").max(120),
  notes: z.string().trim().max(500).optional().nullable(),
  cadence: z.enum(["once", "daily", "weekly", "monthly"]).default("weekly"),
  assignment: z.enum(["anyone", "fixed", "rotate"]).default("anyone"),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const POST = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const input = CreateInput.parse(await body(req));

  // Only a "fixed" chore keeps an assignee, and only if that person is
  // actually in this group.
  const assigneeId =
    input.assignment === "fixed" && input.assigneeId ? input.assigneeId : null;
  if (assigneeId) await assertMemberOfGroup(ctx.group.id, assigneeId);

  await db.insert(chores).values({
    groupId: ctx.group.id,
    title: input.title,
    notes: input.notes || null,
    cadence: input.cadence,
    assignment: input.assignment,
    assigneeId,
    createdBy: ctx.user.id,
  });

  return json(await getChores(ctx.group.id), 201);
});
