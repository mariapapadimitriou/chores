import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth-guard";
import { groupStats, STATS_WEEKS, type GroupStats } from "@/lib/stats";
import { formatDate } from "@/lib/chore-logic";
import { Avatar } from "@/components/Avatar";
import { WeeklyTrend } from "./WeeklyTrend";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StatsPage({ params }: { params: { groupId: string } }) {
  let stats: GroupStats;
  try {
    const ctx = await requireMember(params.groupId);
    stats = await groupStats(ctx.group.id);
  } catch {
    notFound();
  }

  const { ranked, weeks, topChores, total, thisWeekTotal } = stats;

  if (total === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="float text-5xl">📊</div>
        <p className="mt-3 font-medium">Nothing to measure yet</p>
        <p className="mt-1 text-sm text-ink/55">
          Once chores start getting ticked off, this page fills in.
        </p>
      </div>
    );
  }

  const busiest = ranked[0]?.count ? ranked[0] : null;
  const maxMember = Math.max(1, ...ranked.map((r) => r.count));

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Tile label={`Last ${STATS_WEEKS} weeks`} value={total} unit="chores done" />
        <Tile label="This week" value={thisWeekTotal} unit="so far" />
        <Tile
          label="Most active"
          value={busiest ? busiest.member.name : "—"}
          unit={busiest ? `${busiest.count} chores` : "no one yet"}
          person={busiest?.member}
        />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Who did what</h2>
        <p className="mt-1 text-sm text-ink/55">
          Chores completed over the last {STATS_WEEKS} weeks.
        </p>

        {/* Every bar is directly labelled with avatar, name and value, so
            identity never rests on colour alone. */}
        <ul className="mt-5 space-y-3">
          {ranked.map(({ member, count }) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <li key={member.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar person={member} size="xs" faded />
                    <span className="truncate font-medium">{member.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink/55">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-ink/[0.06]">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: count ? `${Math.max(3, (count / maxMember) * 100)}%` : 0,
                      background: member.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Chores per week</h2>
        <p className="mt-1 text-sm text-ink/55">
          The whole household, from {formatDate(weeks[0].start)}.
        </p>
        <WeeklyTrend weeks={weeks} />
      </section>

      {topChores.length > 1 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Most-done chores</h2>
          <ul className="mt-4 divide-y divide-ink/5">
            {topChores.map((c) => (
              <li
                key={c.title}
                className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate">{c.title}</span>
                <span className="shrink-0 tabular-nums text-ink/50">{c.count}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="card p-5 sm:p-6">
        <summary className="cursor-pointer font-semibold">
          Table view
          <span className="ml-2 text-sm font-normal text-ink/45">
            every number on this page
          </span>
        </summary>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <caption className="sr-only">
              Chores completed per member over the last {STATS_WEEKS} weeks
            </caption>
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/45">
                <th scope="col" className="py-2 pr-3 font-medium">Member</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Chores</th>
                <th scope="col" className="py-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ member, count }) => (
                <tr key={member.id} className="border-b border-ink/5">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {member.emoji} {member.name}
                  </th>
                  <td className="py-2 pr-3 text-right tabular-nums">{count}</td>
                  <td className="py-2 text-right tabular-nums">
                    {total ? Math.round((count / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <th scope="row" className="py-2 pr-3 text-left">Total</th>
                <td className="py-2 pr-3 text-right tabular-nums">{total}</td>
                <td className="py-2 text-right tabular-nums">100%</td>
              </tr>
            </tbody>
          </table>

          <table className="mt-6 w-full min-w-[20rem] text-left text-sm">
            <caption className="sr-only">Chores completed per week</caption>
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/45">
                <th scope="col" className="py-2 pr-3 font-medium">Week of</th>
                <th scope="col" className="py-2 text-right font-medium">Chores</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.start} className="border-b border-ink/5">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {formatDate(w.start)}
                  </th>
                  <td className="py-2 text-right tabular-nums">{w.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Tile({
  label,
  value,
  unit,
  person,
}: {
  label: string;
  value: string | number;
  unit: string;
  person?: Member;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        {person && <Avatar person={person} size="sm" />}
        {/* Proportional figures on the hero number, not tabular-nums. */}
        <span className="truncate text-3xl font-semibold tracking-tight">{value}</span>
      </div>
      <div className="mt-0.5 text-sm text-ink/50">{unit}</div>
    </div>
  );
}
