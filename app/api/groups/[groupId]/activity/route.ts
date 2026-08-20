import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { completions, reactions } from "@/lib/db/schema";
import { requireMember } from "@/lib/auth-guard";
import { handle, json } from "@/lib/api";
import type { Completion } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { groupId: string } };

const PAGE = 25;

export const GET = handle(async (req: Request, { params }: Params) => {
  const ctx = await requireMember(params.groupId);
  const url = new URL(req.url);

  // Cursor is the `at` of the last row seen — keyset paging, so new entries
  // arriving mid-scroll can't shift the page boundary.
  const cursorRaw = url.searchParams.get("before");
  const cursor = cursorRaw ? new Date(Number(cursorRaw)) : null;

  const where =
    cursor && !Number.isNaN(cursor.getTime())
      ? and(eq(completions.groupId, ctx.group.id), lt(completions.at, cursor))
      : eq(completions.groupId, ctx.group.id);

  const rows = await db
    .select()
    .from(completions)
    .where(where)
    .orderBy(desc(completions.at))
    .limit(PAGE + 1);

  const hasMore = rows.length > PAGE;
  const page = rows.slice(0, PAGE);

  const reactionRows = page.length
    ? await db
        .select()
        .from(reactions)
        .where(
          inArray(
            reactions.completionId,
            page.map((r) => r.id)
          )
        )
    : [];

  const items: Completion[] = page.map((r) => {
    const mine = reactionRows.filter((x) => x.completionId === r.id);
    const byEmoji = new Map<string, string[]>();
    for (const x of mine) {
      byEmoji.set(x.emoji, [...(byEmoji.get(x.emoji) ?? []), x.userId]);
    }
    return {
      id: r.id,
      choreId: r.choreId,
      choreTitle: r.choreTitle,
      byId: r.userId,
      at: r.at.getTime(),
      note: r.note,
      reactions: [...byEmoji.entries()].map(([emoji, userIds]) => ({ emoji, userIds })),
    };
  });

  return json({
    items,
    nextCursor: hasMore && page.length ? page[page.length - 1].at.getTime() : null,
  });
});
