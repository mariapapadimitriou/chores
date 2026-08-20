import { and, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { chores, completions, groups, memberships, users } from "@/lib/db/schema";
import { isOverdue, startOfWeek } from "@/lib/chore-logic";
import { inviteCode } from "@/lib/ids";
import { STARTER_CHORES } from "@/lib/types";
import type { Chore, Group, GroupSummary, Member, Role } from "@/lib/types";

/** Last completion per chore, for a set of groups. One query, no N+1. */
export async function lastDoneByChore(groupIds: string[]) {
  const map = new Map<string, { at: number; byId: string | null }>();
  if (!groupIds.length) return map;

  const rows = await db
    .selectDistinctOn([completions.choreId], {
      choreId: completions.choreId,
      at: completions.at,
      userId: completions.userId,
    })
    .from(completions)
    .where(inArray(completions.groupId, groupIds))
    .orderBy(completions.choreId, desc(completions.at));

  for (const r of rows) {
    if (r.choreId) map.set(r.choreId, { at: r.at.getTime(), byId: r.userId });
  }
  return map;
}

export function toChore(
  row: typeof chores.$inferSelect,
  lastDone?: { at: number; byId: string | null }
): Chore {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    cadence: row.cadence,
    assignment: row.assignment,
    assigneeId: row.assigneeId,
    snoozedUntil: row.snoozedUntil ? row.snoozedUntil.getTime() : null,
    createdAt: row.createdAt.getTime(),
    lastDone: lastDone ?? null,
  };
}

export async function listMyGroups(userId: string): Promise<GroupSummary[]> {
  const rows = await db
    .select({ group: groups, role: memberships.role })
    .from(memberships)
    .innerJoin(groups, eq(groups.id, memberships.groupId))
    .where(eq(memberships.userId, userId))
    .orderBy(groups.name);

  if (!rows.length) return [];
  const groupIds = rows.map((r) => r.group.id);

  const [allChores, allMembers, lastDone] = await Promise.all([
    db
      .select()
      .from(chores)
      .where(and(inArray(chores.groupId, groupIds), eq(chores.archived, false))),
    db
      .select({ groupId: memberships.groupId })
      .from(memberships)
      .where(inArray(memberships.groupId, groupIds)),
    lastDoneByChore(groupIds),
  ]);

  const now = Date.now();
  return rows.map(({ group, role }) => {
    const mine = allChores.filter((c) => c.groupId === group.id);
    return {
      id: group.id,
      name: group.name,
      role: role as Role,
      memberCount: allMembers.filter((m) => m.groupId === group.id).length,
      choreCount: mine.length,
      overdueCount: mine.filter((c) => isOverdue(toChore(c, lastDone.get(c.id)), now))
        .length,
    };
  });
}

export async function getMembers(groupId: string): Promise<Member[]> {
  const rows = await db
    .select({ user: users, role: memberships.role, joinedAt: memberships.joinedAt })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.groupId, groupId))
    // Join order is the rotation order — keep it stable.
    .orderBy(memberships.joinedAt);

  return rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    emoji: r.user.emoji,
    color: r.user.color,
    role: r.role as Role,
    joinedAt: r.joinedAt.getTime(),
  }));
}

export async function getGroup(groupId: string, role: Role): Promise<Group> {
  const [row] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.inviteCode,
    role,
    members: await getMembers(groupId),
  };
}

export async function getChores(groupId: string): Promise<Chore[]> {
  const [rows, lastDone] = await Promise.all([
    db
      .select()
      .from(chores)
      .where(and(eq(chores.groupId, groupId), eq(chores.archived, false)))
      .orderBy(desc(chores.createdAt)),
    lastDoneByChore([groupId]),
  ]);
  return rows.map((r) => toChore(r, lastDone.get(r.id)));
}

/** How many chores each member has completed since Monday. */
export async function weekTally(groupId: string): Promise<Record<string, number>> {
  const since = new Date(startOfWeek());
  const rows = await db
    .select({ userId: completions.userId })
    .from(completions)
    .where(and(eq(completions.groupId, groupId), gte(completions.at, since)));

  const tally: Record<string, number> = {};
  for (const r of rows) {
    if (r.userId) tally[r.userId] = (tally[r.userId] ?? 0) + 1;
  }
  return tally;
}

/** Create a group, make the creator its owner, and seed the starter chores. */
export async function createGroup(userId: string, name: string): Promise<string> {
  let code = inviteCode();
  // Collisions are vanishingly rare at 32^8, but a retry is cheap insurance.
  for (let i = 0; i < 5; i++) {
    const [clash] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.inviteCode, code))
      .limit(1);
    if (!clash) break;
    code = inviteCode();
  }

  const [group] = await db
    .insert(groups)
    .values({ name, inviteCode: code, createdBy: userId })
    .returning({ id: groups.id });

  await db
    .insert(memberships)
    .values({ groupId: group.id, userId, role: "owner" });

  await db.insert(chores).values(
    STARTER_CHORES.map((c) => ({
      groupId: group.id,
      title: c.title,
      cadence: c.cadence,
      createdBy: userId,
    }))
  );

  return group.id;
}

/** Chores across all a user's groups that are currently pointed at them. */
export async function myChores(userId: string) {
  const memberOf = await db
    .select({ groupId: memberships.groupId })
    .from(memberships)
    .where(eq(memberships.userId, userId));

  const groupIds = memberOf.map((m) => m.groupId);
  if (!groupIds.length) return [];

  const [rows, lastDone, allMembers] = await Promise.all([
    db
      .select({ chore: chores, groupName: groups.name })
      .from(chores)
      .innerJoin(groups, eq(groups.id, chores.groupId))
      .where(and(inArray(chores.groupId, groupIds), eq(chores.archived, false))),
    lastDoneByChore(groupIds),
    db
      .select({
        groupId: memberships.groupId,
        userId: memberships.userId,
        joinedAt: memberships.joinedAt,
      })
      .from(memberships)
      .where(inArray(memberships.groupId, groupIds))
      .orderBy(memberships.joinedAt),
  ]);

  return rows.map((r) => ({
    chore: toChore(r.chore, lastDone.get(r.chore.id)),
    groupId: r.chore.groupId,
    groupName: r.groupName,
    members: allMembers
      .filter((m) => m.groupId === r.chore.groupId)
      .map((m) => ({ id: m.userId })),
  }));
}

export { isNull };
