/**
 * JSON shapes exchanged between the API routes and the client components.
 * Timestamps travel as epoch milliseconds so the chore-status maths in
 * lib/chore-logic.ts stays plain number arithmetic on both sides.
 */

export type Cadence = "once" | "daily" | "weekly" | "monthly";
export type Assignment = "anyone" | "fixed" | "rotate";
export type Role = "owner" | "member";

export type Profile = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type Me = Profile & {
  email: string;
  onboarded: boolean;
};

export type Member = Profile & {
  role: Role;
  joinedAt: number;
};

export type GroupSummary = {
  id: string;
  name: string;
  role: Role;
  memberCount: number;
  choreCount: number;
  overdueCount: number;
};

export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  role: Role;
  members: Member[];
};

export type Chore = {
  id: string;
  title: string;
  notes?: string | null;
  cadence: Cadence;
  assignment: Assignment;
  assigneeId?: string | null;
  snoozedUntil?: number | null;
  createdAt: number;
  lastDone?: { at: number; byId: string | null } | null;
};

export type Completion = {
  id: string;
  choreId: string | null;
  choreTitle: string;
  byId: string | null;
  at: number;
  note?: string | null;
  reactions: { emoji: string; userIds: string[] }[];
};

export type ShoppingItem = {
  id: string;
  title: string;
  notes?: string | null;
  addedBy: string | null;
  boughtBy: string | null;
  boughtAt: number | null;
  createdAt: number;
};

export type BoardData = {
  group: Group;
  chores: Chore[];
  updatedAt: number;
};

/** Seeded into every new group so the board is never empty on day one. */
export const STARTER_CHORES: { title: string; cadence: Cadence }[] = [
  { title: "Take out the trash", cadence: "weekly" },
  { title: "Wipe the kitchen counters", cadence: "daily" },
  { title: "Vacuum the living room", cadence: "weekly" },
  { title: "Clean the bathroom", cadence: "weekly" },
  { title: "Water the plants", cadence: "weekly" },
];

/**
 * Member identity colours. These double as the categorical chart palette on the
 * stats page, so the set and its order are not arbitrary — dark mode is not a
 * flip of the light palette, it is its own selection: this sequence was picked
 * and validated against the dark surfaces (#151D2B card, #0B111C page) for
 * lightness band, chroma floor, dichromat separation, and 3:1 contrast. The
 * order matters too — cyan and indigo are the closest pair under deuteranopia,
 * so they are kept apart in the picker and the legend.
 *
 * Colour is never the only channel: charts direct-label every bar and ship a
 * table view. Re-validate before changing or reordering.
 */
export const AVATAR_COLORS = [
  "#1F7FBF", // blue
  "#FF7A90", // pink
  "#9DB83A", // lime
  "#35B8C9", // cyan
  "#8B93F0", // indigo
  "#C96A35", // orange
];

export const AVATAR_EMOJI = [
  "🌊", "🌸", "🌿", "🔥", "⭐", "🌙", "🍋", "🐢",
  "🦊", "🐙", "🌻", "🍄", "🫐", "🐝", "🪴", "🧊",
];
