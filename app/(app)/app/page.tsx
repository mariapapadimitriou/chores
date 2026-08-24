import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { myChores, listMyGroups } from "@/lib/groups";
import {
  CADENCE_LABEL,
  effectiveAssigneeId,
  formatRel,
  overdueLabel,
  statusOf,
} from "@/lib/chore-logic";
import type { Chore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyChoresPage() {
  const user = await requireUser();
  const [rows, groups] = await Promise.all([myChores(user.id), listMyGroups(user.id)]);

  if (!groups.length) {
    return (
      <div className="card p-10 text-center">
        <div className="float text-5xl">🏠</div>
        <h1 className="mt-3 text-xl font-semibold">Welcome to Chorella</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg/65">
          Start a group for your household, or join one with a code a housemate
          sent you.
        </p>
        <Link href="/app/groups" className="btn btn-primary mt-5">
          Create or join a group
        </Link>
      </div>
    );
  }

  // Chores currently pointed at me: fixed to me, or my turn on a rotation.
  const mine = rows
    .filter((r) => effectiveAssigneeId(r.chore, r.members) === user.id)
    .map((r) => ({ ...r, status: statusOf(r.chore) }))
    .sort((a, b) => rank(a.status) - rank(b.status));

  const late = mine.filter((m) => m.status === "late");
  const soon = mine.filter((m) => m.status === "due");
  const rest = mine.filter((m) => m.status !== "late" && m.status !== "due");

  return (
    <div>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-fg/60">
          Across all your groups
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {user.emoji} Your chores
        </h1>
      </header>

      {mine.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="float text-5xl">🌤️</div>
          <p className="mt-3 font-medium">Nothing has your name on it</p>
          <p className="mt-1 text-sm text-fg/65">
            Assign a chore to yourself, or set one to rotate, and it&apos;ll turn up
            here when it&apos;s your turn.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          <Section title="Overdue" tone="rose" items={late} />
          <Section title="Due today" tone="clay" items={soon} />
          <Section title="Coming up" tone="fg" items={rest} />
        </div>
      )}
    </div>
  );
}

function rank(s: string) {
  return s === "late" ? 0 : s === "due" ? 1 : s === "idle" ? 2 : 3;
}

type Item = {
  chore: Chore;
  groupId: string;
  groupName: string;
  status: string;
};

function Section({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "rose" | "clay" | "fg";
  items: Item[];
}) {
  if (!items.length) return null;
  const dot =
    tone === "rose" ? "bg-rose" : tone === "clay" ? "bg-sun" : "bg-fg/25";

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-fg/55">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m.chore.id}>
            <Link
              href={`/g/${m.groupId}`}
              className="card card-lift flex items-center gap-3 p-4 transition hover:border-fg/25"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.chore.title}</span>
                  <span className="chip bg-fg/5 text-fg/70">
                    {CADENCE_LABEL[m.chore.cadence]}
                  </span>
                  {m.status === "late" && (
                    <span className="chip bg-rose/15 text-rose">
                      {overdueLabel(m.chore)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-fg/55">
                  {m.groupName}
                  {m.chore.lastDone && ` · last done ${formatRel(m.chore.lastDone.at)}`}
                </p>
              </div>
              <span className="shrink-0 text-fg/50" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
