"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { formatRel } from "@/lib/chore-logic";
import type { Member, ShoppingItem } from "@/lib/types";

export function ShoppingClient({
  groupId,
  meId,
  members,
  initial,
}: {
  groupId: string;
  meId: string;
  members: Member[];
  initial: ShoppingItem[];
}) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/groups/${groupId}/shopping`;
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const needed = items.filter((i) => !i.boughtAt);
  const bought = items.filter((i) => i.boughtAt);

  async function send(path: string, init: RequestInit) {
    setError(null);
    const res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "That didn't work.");
      return false;
    }
    setItems(await res.json());
    return true;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      if (await send(base, { method: "POST", body: JSON.stringify({ title: title.trim() }) })) {
        setTitle("");
      }
    } finally {
      setBusy(false);
    }
  }

  const toggle = (i: ShoppingItem) =>
    send(`${base}/${i.id}`, {
      method: "PATCH",
      body: JSON.stringify({ bought: !i.boughtAt }),
    });

  const remove = (i: ShoppingItem) =>
    send(`${base}/${i.id}`, { method: "DELETE" });

  function Row({ item }: { item: ShoppingItem }) {
    const done = !!item.boughtAt;
    const who = byId.get((done ? item.boughtBy : item.addedBy) ?? "");
    return (
      <li className="card card-lift group flex items-center gap-3 p-4">
        <button
          onClick={() => toggle(item)}
          aria-label={done ? `Mark ${item.title} as still needed` : `Mark ${item.title} as bought`}
          className={
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition " +
            (done
              ? "border-moss/30 bg-moss/10 text-moss"
              : "border-fg/15 hover:border-fg/40 hover:bg-fg/5")
          }
        >
          {done ? "✓" : "○"}
        </button>

        <div className="min-w-0 flex-1">
          <div className={done ? "text-fg/55 line-through" : "font-medium"}>
            {item.title}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg/55">
            {who && <Avatar person={who} size="xs" faded />}
            <span>
              {done
                ? `bought by ${who?.id === meId ? "you" : who?.name ?? "someone"} ${formatRel(item.boughtAt!)}`
                : `added by ${who?.id === meId ? "you" : who?.name ?? "someone"} ${formatRel(item.createdAt)}`}
            </span>
          </div>
        </div>

        <button
          onClick={() => remove(item)}
          className="btn shrink-0 text-xs text-fg/50 transition hover:bg-rose/10 hover:text-rose focus:text-rose group-hover:text-fg/70"
          aria-label={`Delete ${item.title}`}
        >
          Delete
        </button>
      </li>
    );
  }

  return (
    <div>
      <section className="card p-4 sm:p-5">
        <form onSubmit={add} className="flex gap-2">
          <input
            className="flex-1"
            placeholder="Add to the list… e.g. Washing-up liquid"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            aria-label="Item"
          />
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || busy}>
            {busy ? "…" : "+ Add"}
          </button>
        </form>
      </section>

      {error && (
        <p className="mt-4 rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-7">
        <section>
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-lg font-semibold">Need to buy</h2>
            <span className="text-xs text-fg/55">{needed.length}</span>
          </div>
          {needed.length ? (
            <ul className="space-y-2">
              {needed.map((i) => (
                <Row key={i.id} item={i} />
              ))}
            </ul>
          ) : (
            <div className="card p-10 text-center">
              <div className="float text-5xl">🧺</div>
              <p className="mt-3 font-medium">The list is clear</p>
              <p className="mt-1 text-sm text-fg/65">Add something above when you notice it running low.</p>
            </div>
          )}
        </section>

        {bought.length > 0 && (
          <section>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-fg/70">Bought</h2>
              <span className="text-xs text-fg/55">{bought.length}</span>
            </div>
            <ul className="space-y-2">
              {bought.map((i) => (
                <Row key={i.id} item={i} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
