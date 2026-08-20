import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
import { requireMember } from "@/lib/auth-guard";
import { handle, json } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: { groupId: string } };

export const POST = handle(async (_req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);

  if (ctx.membership.role === "owner") {
    const [other] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(eq(memberships.groupId, ctx.group.id), ne(memberships.userId, ctx.user.id))
      )
      .limit(1);

    // Letting the only owner walk out would strand the group with no one able
    // to manage it.
    if (other) {
      return json(
        {
          error:
            "Hand ownership to someone else before leaving, or delete the group.",
        },
        409
      );
    }
  }

  await db.delete(memberships).where(eq(memberships.id, ctx.membership.id));
  return json({ ok: true });
});
