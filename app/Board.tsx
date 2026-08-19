"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cadence, Chore, Completion, Roommate, State } from "@/lib/types";

type Props = { initial: State };

const CADENCE_LABEL: Record<Cadence, string> = {
  once: "one-off",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

const CADENCE_ORDER: Cadence[] = ["daily", "weekly", "monthly", "once"];

export default function Board({ initial }: Props) {
  const [state, setState] = useState<State>(initial);
  const [me, setMe] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // Remember who's using the app on this device.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("chores:me") : null;
    if (saved && state.roommates.some((r) => r.id === saved)) setMe(saved);
    else setMe(state.roommates[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (me) localStorage.setItem("chores:me", me);
  }, [me]);

  // Gentle background refresh so the sister's changes show up.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        if (r.ok) {
          const next = (await r.json()) as State;
          setState((prev) => (next.updatedAt > prev.updatedAt ? next : prev));
        }
      } catch {}
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const meRoommate = state.roommates.find((r) => r.id === me);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekTally = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of state.roommates) map.set(r.id, 0);
    for (const h of state.history) {
      if (h.at >= weekStart) map.set(h.byId, (map.get(h.byId) ?? 0) + 1);
    }
    return map;
  }, [state, weekStart]);

  const lastDone = useMemo(() => {
    const map = new Map<string, Completion>();
    for (const h of state.history) {
      const prev = map.get(h.choreId);
      if (!prev || h.at > prev.at) map.set(h.choreId, h);
    }
    return map;
  }, [state]);

  const activeChores = state.chores.filter((c) => !c.archived);
  const groupedChores = useMemo(() => {
    const g: Record<Cadence, Chore[]> = { daily: [], weekly: [], monthly: [], once: [] };
    for (const c of activeChores) g[c.cadence].push(c);
    return g;
  }, [activeChores]);

  async function apply<T extends State>(promise: Promise<Response>) {
    const r = await promise;
    if (r.ok) setState(await r.json());
  }

  async function addChore(input: { title: string; cadence: Cadence; assigneeId: string | null; notes?: string }) {
    await apply(
      fetch("/api/chores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      })
    );
  }

  async function completeChore(choreId: string, note?: string) {
    if (!me) return;
    await apply(
      fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ byId: me, note }),
      })
    );
  }

  async function editChore(id: string, patch: Partial<Chore>) {
    await apply(
      fetch(`/api/chores/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      })
    );
  }

  async function deleteChore(id: string) {
    await apply(fetch(`/api/chores/${id}`, { method: "DELETE" }));
  }

  async function undoCompletion(id: string) {
    await apply(fetch(`/api/history/${id}`, { method: "DELETE" }));
  }

  async function saveRoommates(next: Roommate[]) {
    await apply(
      fetch("/api/roommates", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roommates: next }),
      })
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:pt-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink/50">The apartment</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Our Chores</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowSettings(true)} aria-label="Settings">
          <span className="text-lg">⚙︎</span>
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      <section className="card mb-6 rounded-3xl p-5">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink/50">This week</div>
        <div className="flex flex-wrap gap-3">
          {state.roommates.map((r) => {
            const n = weekTally.get(r.id) ?? 0;
            const active = r.id === me;
            return (
              <button
                key={r.id}
                onClick={() => setMe(r.id)}
                className={
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition " +
                  (active
                    ? "border-ink/80 bg-ink text-cream"
                    : "border-ink/10 bg-white/70 hover:border-ink/40")
                }
                title={active ? "That's you" : `Set me to ${r.name}`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ background: r.color, color: "#FFFDF8" }}
                >
                  {r.emoji}
                </span>
                <div className="text-left">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className={"text-xs " + (active ? "text-cream/70" : "text-ink/50")}>
                    {n} chore{n === 1 ? "" : "s"} done
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-ink/50">
          You're checked in as{" "}
          <span className="font-medium text-ink">
            {meRoommate ? `${meRoommate.emoji} ${meRoommate.name}` : "—"}
          </span>
          . Tap a card above to switch.
        </div>
      </section>

      <AddChore roommates={state.roommates} defaultAssignee={me} onAdd={addChore} />

      <div className="mt-8 space-y-6">
        {CADENCE_ORDER.map((cad) => {
          const list = groupedChores[cad];
          if (!list.length) return null;
          return (
            <section key={cad}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold capitalize">{CADENCE_LABEL[cad]}</h2>
                <span className="text-xs text-ink/40">{list.length}</span>
              </div>
              <ul className="space-y-2">
                {list.map((c) => (
                  <ChoreRow
                    key={c.id}
                    chore={c}
                    roommates={state.roommates}
                    lastDone={lastDone.get(c.id)}
                    me={me}
                    onComplete={(note) => completeChore(c.id, note)}
                    onEdit={(patch) => editChore(c.id, patch)}
                    onDelete={() => deleteChore(c.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {!activeChores.length && (
          <div className="card rounded-3xl p-8 text-center text-ink/60">
            No chores yet. Add the first one above.
          </div>
        )}
      </div>

      <History history={state.history} roommates={state.roommates} onUndo={undoCompletion} />

      {showSettings && (
        <Settings
          roommates={state.roommates}
          onClose={() => setShowSettings(false)}
          onSave={saveRoommates}
        />
      )}

      <footer className="mt-16 text-center text-xs text-ink/40">
        Made with 🍵 for the apartment. Share this URL with your roommate.
      </footer>
    </div>
  );
}

function AddChore({
  roommates,
  defaultAssignee,
  onAdd,
}: {
  roommates: Roommate[];
  defaultAssignee: string;
  onAdd: (input: { title: string; cadence: Cadence; assigneeId: string | null; notes?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd({
        title: title.trim(),
        cadence,
        assigneeId: assigneeId || null,
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setNotes("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card rounded-3xl p-4 sm:p-5">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            className="flex-1"
            placeholder="Add a chore… e.g. Sweep the kitchen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setOpen(true)}
          />
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || busy}>
            + Add
          </button>
        </div>
        {open && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <div className="mb-1 text-xs text-ink/50">How often</div>
              <select value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)} className="w-full">
                <option value="once">One-off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="text-sm">
              <div className="mb-1 text-xs text-ink/50">Assign to</div>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full">
                <option value="">Anyone</option>
                {roommates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-1">
              <div className="mb-1 text-xs text-ink/50">Notes (optional)</div>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. use the good soap"
                className="w-full"
              />
            </label>
          </div>
        )}
      </form>
    </section>
  );
}

function ChoreRow({
  chore,
  roommates,
  lastDone,
  me,
  onComplete,
  onEdit,
  onDelete,
}: {
  chore: Chore;
  roommates: Roommate[];
  lastDone?: Completion;
  me: string;
  onComplete: (note?: string) => Promise<void>;
  onEdit: (patch: Partial<Chore>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [justDid, setJustDid] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chore.title);
  const [notes, setNotes] = useState(chore.notes ?? "");
  const [cadence, setCadence] = useState<Cadence>(chore.cadence);
  const [assigneeId, setAssigneeId] = useState(chore.assigneeId ?? "");

  const assignee = roommates.find((r) => r.id === chore.assigneeId);
  const lastBy = roommates.find((r) => r.id === lastDone?.byId);

  async function done() {
    if (!me || busy) return;
    setBusy(true);
    setJustDid(true);
    try {
      await onComplete();
    } finally {
      setBusy(false);
      setTimeout(() => setJustDid(false), 600);
    }
  }

  async function saveEdit() {
    await onEdit({
      title: title.trim() || chore.title,
      notes: notes.trim(),
      cadence,
      assigneeId: assigneeId || null,
    });
    setEditing(false);
  }

  const fresh = isFresh(chore.cadence, lastDone?.at);

  return (
    <li className="card group rounded-2xl">
      {!editing ? (
        <div className="flex items-start gap-3 p-4">
          <button
            onClick={done}
            disabled={busy || !me}
            className={
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition " +
              (fresh
                ? "border-moss/30 bg-moss/10 text-moss"
                : "border-ink/15 hover:border-ink/40 hover:bg-ink/5")
            }
            aria-label="Mark done"
            title={fresh ? "Recently done — tap again if you did it again" : "Mark done"}
          >
            <span className={"text-lg " + (justDid ? "pop" : "")}>{fresh ? "✓" : "○"}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className={"font-medium " + (justDid ? "strike" : "")}>{chore.title}</div>
              <span className="chip bg-ink/5 text-ink/60">{CADENCE_LABEL[chore.cadence]}</span>
              {assignee && (
                <span
                  className="chip"
                  style={{ background: assignee.color + "22", color: assignee.color }}
                >
                  {assignee.emoji} {assignee.name}
                </span>
              )}
            </div>
            {chore.notes && <div className="mt-1 text-sm text-ink/60">{chore.notes}</div>}
            <div className="mt-1 text-xs text-ink/40">
              {lastDone && lastBy ? (
                <>
                  Last done {formatRel(lastDone.at)} by {lastBy.emoji} {lastBy.name}
                </>
              ) : (
                <>Not done yet</>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button className="btn btn-ghost text-xs" onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              className="w-full"
            >
              <option value="once">One-off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full"
            >
              <option value="">Anyone</option>
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.emoji} {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              className="btn btn-ghost text-sm text-rose"
              onClick={async () => {
                if (confirm(`Delete "${chore.title}"?`)) await onDelete();
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
      )}
    </li>
  );
}

function History({
  history,
  roommates,
  onUndo,
}: {
  history: Completion[];
  roommates: Roommate[];
  onUndo: (id: string) => Promise<void>;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? history : history.slice(0, 12);
  return (
    <section className="mt-12">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        <span className="text-xs text-ink/40">{history.length} entries</span>
      </div>
      {rows.length === 0 ? (
        <div className="card rounded-2xl p-6 text-center text-sm text-ink/50">
          No chores done yet. The first ✓ starts the log.
        </div>
      ) : (
        <ol className="card divide-y divide-ink/5 overflow-hidden rounded-2xl">
          {rows.map((h) => {
            const r = roommates.find((x) => x.id === h.byId);
            return (
              <li key={h.id} className="group flex items-center gap-3 px-4 py-3 text-sm">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ background: (r?.color ?? "#999") + "22", color: r?.color ?? "#333" }}
                >
                  {r?.emoji ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className="font-medium">{r?.name ?? "Someone"}</span>
                    <span className="text-ink/60"> did </span>
                    <span className="font-medium">{h.choreTitle}</span>
                  </div>
                  {h.note && <div className="text-xs text-ink/50">“{h.note}”</div>}
                </div>
                <div className="shrink-0 text-xs text-ink/40">{formatRel(h.at)}</div>
                <button
                  className="btn btn-ghost text-xs opacity-0 transition group-hover:opacity-100"
                  onClick={() => onUndo(h.id)}
                  title="Undo (removes from history)"
                >
                  Undo
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {history.length > 12 && (
        <div className="mt-3 text-center">
          <button className="btn btn-ghost text-sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less" : `Show all (${history.length})`}
          </button>
        </div>
      )}
    </section>
  );
}

function Settings({
  roommates,
  onClose,
  onSave,
}: {
  roommates: Roommate[];
  onClose: () => void;
  onSave: (next: Roommate[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Roommate[]>(() => roommates.map((r) => ({ ...r })));

  function update(i: number, patch: Partial<Roommate>) {
    setDraft((d) => d.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save() {
    await onSave(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Roommates</h3>
          <button className="btn btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-3">
          {draft.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-ink/10 p-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{ background: r.color, color: "#FFFDF8" }}
              >
                {r.emoji}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  value={r.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="w-full"
                  placeholder="Name"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={r.emoji}
                    onChange={(e) => update(i, { emoji: e.target.value })}
                    className="w-20 text-center"
                    placeholder="🌸"
                  />
                  <input
                    type="color"
                    value={r.color}
                    onChange={(e) => update(i, { color: e.target.value })}
                    className="h-10 w-14 cursor-pointer p-0"
                    style={{ padding: 0 }}
                  />
                  <div className="text-xs text-ink/50">emoji &amp; color</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
        <p className="mt-4 text-xs text-ink/40">
          Everyone shares one board. Rename to whatever fits — pet names encouraged.
        </p>
      </div>
    </div>
  );
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.getTime();
}

function isFresh(cadence: Cadence, at?: number) {
  if (!at) return false;
  const ago = Date.now() - at;
  const day = 86_400_000;
  if (cadence === "daily") return ago < day;
  if (cadence === "weekly") return ago < 7 * day;
  if (cadence === "monthly") return ago < 30 * day;
  return ago < 2 * day; // one-off: consider fresh for 2 days after completion
}

function formatRel(t: number) {
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  const date = new Date(t);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
