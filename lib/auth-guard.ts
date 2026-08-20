import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships, groups } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import type { UserRow, MembershipRow, GroupRow } from "@/lib/db/schema";

/**
 * Thrown by the guards below. API routes turn this into a JSON response with
 * the right status; pages catch it and redirect.
 *
 * Every route handler and page that reads a groupId from the URL MUST go
 * through requireMember/requireOwner first. Skipping it means any signed-in
 * user could read another household's board by guessing an id.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export type GroupContext = {
  user: UserRow;
  membership: MembershipRow;
  group: GroupRow;
};

export async function requireUser(): Promise<UserRow> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "You need to be signed in.");
  return user;
}

export async function requireMember(groupId: string): Promise<GroupContext> {
  const user = await requireUser();

  if (!isUuid(groupId)) throw new HttpError(404, "Group not found.");

  const [row] = await db
    .select({ membership: memberships, group: groups })
    .from(memberships)
    .innerJoin(groups, eq(groups.id, memberships.groupId))
    .where(and(eq(memberships.groupId, groupId), eq(memberships.userId, user.id)))
    .limit(1);

  // Deliberately the same error whether the group is missing or the user
  // simply is not in it — do not confirm that someone else's group exists.
  if (!row) throw new HttpError(403, "You are not a member of this group.");

  return { user, membership: row.membership, group: row.group };
}

export async function requireOwner(groupId: string): Promise<GroupContext> {
  const ctx = await requireMember(groupId);
  if (ctx.membership.role !== "owner") {
    throw new HttpError(403, "Only the group owner can do that.");
  }
  return ctx;
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/**
 * Guard for accepting a user id from a request body — an assignee, say.
 * Without it you could assign a chore to someone outside the household.
 */
export async function assertMemberOfGroup(groupId: string, userId: string) {
  const [row] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.groupId, groupId), eq(memberships.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError(400, "That person is not in this group.");
}
