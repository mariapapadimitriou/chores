import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { completions } from "@/lib/db/schema";
import { getMembers } from "@/lib/groups";
import { DAY_MS, startOfWeek } from "@/lib/chore-logic";
import type { Member } from "@/lib/types";

export const STATS_WEEKS = 8;

export type GroupStats = {
  members: Member[];
  total: number;
  thisWeekTotal: number;
  /** Members ordered by chores done, descending. */
  ranked: { member: Member; count: number }[];
  weeks: { start: number; total: number }[];
  topChores: { title: string; count: number }[];
};

export async function groupStats(groupId: string): Promise<GroupStats> {
  const thisWeekStart = startOfWeek();
  const windowStart = thisWeekStart - (STATS_WEEKS - 1) * 7 * DAY_MS;

  const [members, rows] = await Promise.all([
    getMembers(groupId),
    db
      .select({
        userId: completions.userId,
        at: completions.at,
        choreTitle: completions.choreTitle,
      })
      .from(completions)
      .where(
        and(eq(completions.groupId, groupId), gte(completions.at, new Date(windowStart)))
      )
      .orderBy(desc(completions.at)),
  ]);

  const weeks = Array.from({ length: STATS_WEEKS }, (_, i) => ({
    start: windowStart + i * 7 * DAY_MS,
    total: 0,
  }));

  const perMember = new Map<string, number>(members.map((m) => [m.id, 0]));
  const perChore = new Map<string, number>();
  let thisWeekTotal = 0;

  for (const r of rows) {
    const t = r.at.getTime();
    const idx = Math.floor((t - windowStart) / (7 * DAY_MS));
    if (idx >= 0 && idx < STATS_WEEKS) weeks[idx].total += 1;
    if (t >= thisWeekStart) thisWeekTotal += 1;
    // Completions by someone who has since left the group still count toward
    // the total, but have no member row to attribute to.
    if (r.userId && perMember.has(r.userId)) {
      perMember.set(r.userId, (perMember.get(r.userId) ?? 0) + 1);
    }
    perChore.set(r.choreTitle, (perChore.get(r.choreTitle) ?? 0) + 1);
  }

  return {
    members,
    total: rows.length,
    thisWeekTotal,
    ranked: members
      .map((m) => ({ member: m, count: perMember.get(m.id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    weeks,
    topChores: [...perChore.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
}
