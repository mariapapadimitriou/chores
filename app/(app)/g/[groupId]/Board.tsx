"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Confetti } from "@/components/Confetti";
import {
  CADENCE_LABEL,
  CADENCE_ORDER,
  cadenceMs,
  effectiveAssigneeId,
  formatDate,
  formatRel,
  groupByCadence,
  overdueLabel,
  statusOf,
} from "@/lib/chore-logic";
import type { Assignment, Cadence, Chore, Group, Member } from "@/lib/types";

type Props = {
  meId: string;
  initialGroup: Group;
  initialChores: Chore[];
  initialTally: Record<string, number>;
};

export function Board({ meId, initialGroup, initialChores, initialTally }: Props) {
  const [group, setGroup] = useState(initialGroup);
  const [chores, setChores] = useState(initialChores);
  const [tally, setTally] = useState(initialTally);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/groups/${group.id}`;

  /** Every mutation returns the fresh chore list, so state stays in one place. */
  const send = useCallback(
    async (path: string, init: RequestInit): Promise<boolean> => {
      setError(null);
      const res = await fetch(path, {
        ...init,
        headers: { "content-type": "application/json", ...(init.headers ?? {}) },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "That didn't work. Try again?");
        return false;
      }
      setChores(await res.json());
      return true;
    },
    []
  );

  // Pick up housemates' changes without a reload.
  //
  // Only while the tab is actually being looked at. A background tab polling
  // on a timer would keep the database's compute endpoint permanently awake —
  // that idle traffic, not real usage, is what burns through a free tier. On
  // returning to the tab we refresh once immediately, so it still feels live.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const pull = async () => {
      try {
        const res = await fetch(base, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setChores(data.chores);
        setGroup(data.group);
        setTally(data.weekTally);
      } catch {
        /* offline; the next tick will retry */
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(pull, 30_000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        pull();
        start();
      } else {
        stop();
      }
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [base]);

  const refreshTally = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: "no-store" });
      if (res.ok) setTally((await res.json()).weekTally);
    } catch {
      /* non-critical */
    }
  }, [base]);

  const grouped = useMemo(() => groupByCadence(chores), [chores]);
  const totalThisWeek = Object.values(tally).reduce((a, b) => a + b, 0);

  return (
    <div>
      <section className="card mb-6 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-fg/60">This week</div>
          <div className="text-xs text-fg/55">
            {totalThisWeek} {totalThisWeek === 1 ? "chore" : "chores"} done
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => {
            const n = tally[m.id] ?? 0;
            const share = totalThisWeek ? Math.round((n / totalThisWeek) * 100) : 0;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-fg/10 bg-fg/[0.04] px-4 py-3"
              >
                <Avatar person={m} size="md" />
                <div>
                  <div className="text-sm font-medium">
                    {m.name}
                    {m.id === meId && <span className="text-fg/55"> (you)</span>}
                  </div>
                  <div className="text-xs text-fg/60">
                    {n} done{totalThisWeek > 0 && ` · ${share}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalThisWeek > 0 && group.members.length > 1 && (
          <div
            className="mt-4 flex h-2 overflow-hidden rounded-full bg-fg/5"
            role="img"
            aria-label={`Share of chores this week: ${group.members
              .map((m) => `${m.name} ${tally[m.id] ?? 0}`)
              .join(", ")}`}
          >
            {group.members.map((m) => {
              const n = tally[m.id] ?? 0;
              if (!n) return null;
              return (
                <div
                  key={m.id}
                  style={{
                    width: `${(n / totalThisWeek) * 100}%`,
                    background: m.color,
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      <AddChore
        members={group.members}
        onAdd={(input) =>
          send(`${base}/chores`, { method: "POST", body: JSON.stringify(input) })
        }
      />

      {error && (
        <p className="mt-4 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-7">
        {CADENCE_ORDER.map((cad) => {
          const list = grouped[cad];
          if (!list.length) return null;
          return (
            <section key={cad}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold capitalize">{CADENCE_LABEL[cad]}</h2>
                <span className="text-xs text-fg/55">{list.length}</span>
              </div>
              <ul className="space-y-2">
                {list.map((c) => (
                  <ChoreRow
                    key={c.id}
                    chore={c}
                    members={group.members}
                    meId={meId}
                    onComplete={async (note) => {
                      const ok = await send(`${base}/chores/${c.id}/complete`, {
                        method: "POST",
                        body: JSON.stringify({ note }),
                      });
                      if (ok) refreshTally();
                    }}
                    onPatch={(patch) =>
                      send(`${base}/chores/${c.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(patch),
                      })
                    }
                    onDelete={() =>
                      send(`${base}/chores/${c.id}`, { method: "DELETE" })
                    }
                  />
                ))}
              </ul>
            </section>
          );
        })}

        {!chores.length && (
          <div className="card p-10 text-center">
            <div className="float text-5xl">🧹</div>
            <p className="mt-3 font-medium">No chores yet</p>
            <p className="mt-1 text-sm text-fg/65">Add the first one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- add form */

type NewChore = {
  title: string;
  cadence: Cadence;
  assignment: Assignment;
  assigneeId: string | null;
  notes?: string;
};

function AddChore({
  members,
  onAdd,
}: {
  members: Member[];
  onAdd: (input: NewChore) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [assignPick, setAssignPick] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const { assignment, assigneeId } = decodeAssign(assignPick);
      const ok = await onAdd({
        title: title.trim(),
        cadence,
        assignment,
        assigneeId,
        notes: notes.trim() || undefined,
      });
      if (ok) {
        setTitle("");
        setNotes("");
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-4 sm:p-5">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            className="flex-1"
            placeholder="Add a chore… e.g. Sweep the kitchen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setOpen(true)}
            maxLength={120}
            aria-label="Chore title"
          />
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || busy}>
            {busy ? "…" : "+ Add"}
          </button>
        </div>

        {open && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="field-label">How often</span>
              <CadenceSelect value={cadence} onChange={setCadence} />
            </label>
            <label className="text-sm">
              <span className="field-label">Assign to</span>
              <AssignSelect value={assignPick} onChange={setAssignPick} members={members} />
            </label>
            <label className="text-sm">
              <span className="field-label">Notes (optional)</span>
              <input
                className="w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. use the good soap"
                maxLength={500}
              />
            </label>
          </div>
        )}
      </form>
    </section>
  );
}

/* ---------------------------------------------------------------- one chore */

function ChoreRow({
  chore,
  members,
  meId,
  onComplete,
  onPatch,
  onDelete,
}: {
  chore: Chore;
  members: Member[];
  meId: string;
  onComplete: (note?: string) => Promise<void>;
  onPatch: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [justDid, setJustDid] = useState(false);
  const [burst, setBurst] = useState(0);
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(chore.title);
  const [notes, setNotes] = useState(chore.notes ?? "");
  const [cadence, setCadence] = useState<Cadence>(chore.cadence);
  const [assignPick, setAssignPick] = useState(() => encodeAssign(chore));

  const status = statusOf(chore);
  const pointedAt = effectiveAssigneeId(chore, members);
  const person = members.find((m) => m.id === pointedAt);
  const lastBy = members.find((m) => m.id === chore.lastDone?.byId);
  const isMine = pointedAt === meId;

  async function done() {
    if (busy) return;
    setBusy(true);
    setJustDid(true);
    setBurst((n) => n + 1);
    try {
      await onComplete();
    } finally {
      setBusy(false);
      setTimeout(() => setJustDid(false), 700);
    }
  }

  async function saveEdit() {
    const { assignment, assigneeId } = decodeAssign(assignPick);
    const ok = await onPatch({
      title: title.trim() || chore.title,
      notes: notes.trim() || null,
      cadence,
      assignment,
      assigneeId,
    });
    if (ok) setEditing(false);
  }

  const circle =
    status === "late"
      ? "border-rose/40 bg-rose/10 text-rose"
      : status === "due"
      ? "border-sun/60 bg-sun/15 text-clay"
      : status === "fresh"
      ? "border-moss/30 bg-moss/10 text-moss"
      : "border-fg/15 hover:border-fg/40 hover:bg-fg/5";

  if (editing) {
    return (
      <li className="card">
        <div className="space-y-3 p-4">
          <input
            className="w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Chore title"
            maxLength={120}
          />
          <input
            className="w-full"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            aria-label="Notes"
            maxLength={500}
          />
          <div className="grid grid-cols-2 gap-3">
            <CadenceSelect value={cadence} onChange={setCadence} />
            <AssignSelect value={assignPick} onChange={setAssignPick} members={members} />
          </div>

          {cadenceMs(chore.cadence) && (
            <div>
              {chore.snoozedUntil && chore.snoozedUntil > Date.now() ? (
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => onPatch({ snoozedUntil: null })}
                >
                  Un-snooze
                </button>
              ) : (
                <button
                  className="btn btn-ghost text-xs"
                  title="Skip one cycle without it counting as late"
                  onClick={() =>
                    onPatch({ snoozedUntil: Date.now() + (cadenceMs(chore.cadence) ?? 0) })
                  }
                >
                  💤 Snooze one cycle
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              className="btn btn-danger text-sm"
              onClick={async () => {
                if (confirm(`Delete “${chore.title}”?\n\nPast completions stay in the activity feed.`)) {
                  await onDelete();
                }
              }}
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="card card-lift group">
      <div className="flex items-start gap-3 p-4">
        <span className="relative mt-0.5 shrink-0">
          <Confetti fire={burst} />
          <button
            onClick={done}
            disabled={busy}
            aria-label={`Mark ${chore.title} as done`}
            className={
              "relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition " +
              circle
            }
          >
            <span className={"text-lg " + (justDid ? "pop" : "")}>
              {status === "fresh" ? "✓" : "○"}
            </span>
          </button>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={"font-medium " + (justDid ? "strike" : "")}>{chore.title}</span>

            {status === "late" && (
              <span className="chip bg-rose/15 text-rose">{overdueLabel(chore)}</span>
            )}
            {status === "due" && <span className="chip bg-sun/20 text-clay">due today</span>}
            {status === "snoozed" && chore.snoozedUntil && (
              <span className="chip bg-fg/5 text-fg/60">
                💤 until {formatDate(chore.snoozedUntil)}
              </span>
            )}

            {person && (
              <span
                className="chip"
                style={{ background: person.color + "22", color: person.color }}
                title={
                  chore.assignment === "rotate"
                    ? "Rotating — this is whose turn it is next"
                    : "Assigned"
                }
              >
                {chore.assignment === "rotate" ? "🔁 next: " : ""}
                {person.emoji} {isMine ? "You" : person.name}
              </span>
            )}
          </div>

          {chore.notes && <p className="mt-1 text-sm text-fg/70">{chore.notes}</p>}

          <p className="mt-1 text-xs text-fg/55">
            {chore.lastDone ? (
              <>
                Last done {formatRel(chore.lastDone.at)}
                {lastBy && ` by ${lastBy.emoji} ${lastBy.id === meId ? "you" : lastBy.name}`}
              </>
            ) : (
              "Not done yet"
            )}
          </p>
        </div>

        {/* Recessive but always present — hover-only controls are unreachable
            on touch devices. */}
        <button
          className="btn btn-ghost shrink-0 text-xs text-fg/55 transition hover:text-fg focus:text-fg group-hover:text-fg"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- small parts */

function CadenceSelect({
  value,
  onChange,
}: {
  value: Cadence;
  onChange: (c: Cadence) => void;
}) {
  return (
    <select
      className="w-full"
      value={value}
      onChange={(e) => onChange(e.target.value as Cadence)}
      aria-label="How often"
    >
      <option value="once">One-off</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  );
}

function AssignSelect({
  value,
  onChange,
  members,
}: {
  value: string;
  onChange: (v: string) => void;
  members: Member[];
}) {
  return (
    <select
      className="w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Assign to"
    >
      <option value="">Anyone</option>
      <option value="rotate">🔁 Rotate between us</option>
      {members.map((m) => (
        <option key={m.id} value={"fixed:" + m.id}>
          {m.emoji} {m.name}
        </option>
      ))}
    </select>
  );
}

/** The three assignment modes collapse into one <select> value. */
function encodeAssign(chore: Chore): string {
  if (chore.assignment === "rotate") return "rotate";
  if (chore.assignment === "fixed" && chore.assigneeId) return "fixed:" + chore.assigneeId;
  return "";
}

function decodeAssign(v: string): { assignment: Assignment; assigneeId: string | null } {
  if (v === "rotate") return { assignment: "rotate", assigneeId: null };
  if (v.startsWith("fixed:")) return { assignment: "fixed", assigneeId: v.slice(6) };
  return { assignment: "anyone", assigneeId: null };
}
