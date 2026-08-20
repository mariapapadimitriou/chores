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
 * stats page, so the set and its order are not arbitrary — this exact sequence
 * passes all six checks of the dataviz palette validator against the #FFFDF8
 * surface (lightness band, chroma floor, CVD separation, normal-vision floor,
 * and 3:1 contrast). Re-run that validator before changing or reordering it:
 *   node scripts/validate_palette.js "<hex,…>" --mode light --surface "#FFFDF8"
 */
export const AVATAR_COLORS = [
  "#D2691E", // orange
  "#2B62C9", // blue
  "#5A8F1A", // green
  "#8A3FB0", // purple
  "#0092AD", // teal
  "#BE2F4F", // rose
];

export const AVATAR_EMOJI = [
  "🌊", "🌸", "🌿", "🔥", "⭐", "🌙", "🍋", "🐢",
  "🦊", "🐙", "🌻", "🍄", "🫐", "🐝", "🪴", "🧊",
];
