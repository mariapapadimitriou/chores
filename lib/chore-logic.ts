import type { Cadence, Chore, Member } from "./types";

export const DAY_MS = 86_400_000;

export const CADENCE_LABEL: Record<Cadence, string> = {
  once: "one-off",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

export const CADENCE_ORDER: Cadence[] = ["daily", "weekly", "monthly", "once"];

export function cadenceMs(cadence: Cadence): number | null {
  if (cadence === "daily") return DAY_MS;
  if (cadence === "weekly") return 7 * DAY_MS;
  if (cadence === "monthly") return 30 * DAY_MS;
  return null;
}

export function isFresh(cadence: Cadence, at?: number | null): boolean {
  if (!at) return false;
  const ago = Date.now() - at;
  const ms = cadenceMs(cadence);
  // One-off chores read as done for two days, then settle to idle.
  return ago < (ms ?? 2 * DAY_MS);
}

export function nextDueAt(chore: Chore): number | null {
  const ms = cadenceMs(chore.cadence);
  if (!ms) return null;
  return (chore.lastDone?.at ?? chore.createdAt) + ms;
}

export type Status = "fresh" | "due" | "late" | "snoozed" | "idle";

export function statusOf(chore: Chore, now = Date.now()): Status {
  if (chore.snoozedUntil && chore.snoozedUntil > now) return "snoozed";
  if (isFresh(chore.cadence, chore.lastDone?.at)) return "fresh";
  const due = nextDueAt(chore);
  if (due == null) return "idle";
  if (now > due) return "late";
  if (due - now < DAY_MS) return "due";
  return "idle";
}

export function overdueLabel(chore: Chore, now = Date.now()): string {
  const due = nextDueAt(chore);
  if (!due) return "";
  const d = Math.floor((now - due) / DAY_MS);
  if (d < 1) return "due today";
  if (d < 7) return `${d}d late`;
  return `${Math.floor(d / 7)}w late`;
}

/** Sort key: most overdue first, snoozed chores park at the bottom. */
export function sortKey(chore: Chore, now = Date.now()): number {
  if (chore.snoozedUntil && chore.snoozedUntil > now) return chore.snoozedUntil;
  return nextDueAt(chore) ?? Number.MAX_SAFE_INTEGER;
}

export function isOverdue(chore: Chore, now = Date.now()): boolean {
  return statusOf(chore, now) === "late";
}

/**
 * Whose turn a rotating chore is next. Cycles group members in join order:
 * the person after whoever completed it last. Falls back to the first member
 * when the chore has never been done, or the last completer has left.
 */
export function nextRotateId(
  chore: Chore,
  members: Pick<Member, "id">[]
): string | null {
  if (!members.length) return null;
  const lastBy = chore.lastDone?.byId;
  if (!lastBy) return members[0].id;
  const i = members.findIndex((m) => m.id === lastBy);
  if (i < 0) return members[0].id;
  return members[(i + 1) % members.length].id;
}

/** Who the row should point at right now, whatever the assignment mode. */
export function effectiveAssigneeId(
  chore: Chore,
  members: Pick<Member, "id">[]
): string | null {
  if (chore.assignment === "fixed") return chore.assigneeId ?? null;
  if (chore.assignment === "rotate") return nextRotateId(chore, members);
  return null;
}

export function groupByCadence(chores: Chore[], now = Date.now()): Record<Cadence, Chore[]> {
  const g: Record<Cadence, Chore[]> = { daily: [], weekly: [], monthly: [], once: [] };
  for (const c of chores) g[c.cadence].push(c);
  for (const cad of CADENCE_ORDER) {
    g[cad].sort((a, b) => sortKey(a, now) - sortKey(b, now));
  }
  return g;
}

export function startOfWeek(d = new Date()): number {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.getTime();
}

export function formatRel(t: number): string {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDate(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
