"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { formatRel } from "@/lib/chore-logic";
import type { Completion, Member } from "@/lib/types";

const REACTIONS = ["👏", "💛", "🙏", "🔥", "😅"] as const;

export function ActivityClient({
  groupId,
  meId,
  members,
}: {
  groupId: string;
  meId: string;
  members: Member[];
}) {
  const [items, setItems] = useState<Completion[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/groups/${groupId}/activity`;
  const byId = new Map(members.map((m) => [m.id, m]));

  const loadFirst = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setCursor(data.nextCursor);
    } catch {
      setError("Couldn't load the activity feed.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`${base}?before=${cursor}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  /** Optimistic toggle — the feed should feel instant. */
  async function toggleReaction(entry: Completion, emoji: string) {
    const existing = entry.reactions.find((r) => r.emoji === emoji);
    const mine = existing?.userIds.includes(meId) ?? false;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== entry.id) return it;
        const others = it.reactions.filter((r) => r.emoji !== emoji);
        const userIds = mine
          ? (existing?.userIds ?? []).filter((u) => u !== meId)
          : [...(existing?.userIds ?? []), meId];
        return {
          ...it,
          reactions: userIds.length ? [...others, { emoji, userIds }] : others,
        };
      })
    );

    const res = await fetch(`${base}/${entry.id}/reactions`, {
      method: mine ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) loadFirst(); // roll back by re-reading the truth
  }

  async function undo(entry: Completion) {
    if (!confirm(`Remove “${entry.choreTitle}” from the history?`)) return;
    const res = await fetch(`${base}/${entry.id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== entry.id));
    else setError("Couldn't remove that entry.");
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-fg/55">Loading…</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="float text-5xl">📖</div>
          <p className="mt-3 font-medium">Nothing here yet</p>
          <p className="mt-1 text-sm text-fg/65">
            The first ✓ on the board starts the history.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((entry) => {
            const who = entry.byId ? byId.get(entry.byId) : undefined;
            return (
              <li key={entry.id} className="card group p-4">
                <div className="flex items-start gap-3">
                  <Avatar person={who} size="sm" faded className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {who ? (who.id === meId ? "You" : who.name) : "Someone"}
                      </span>
                      <span className="text-fg/65"> did </span>
                      <span className="font-medium">{entry.choreTitle}</span>
                      {!entry.choreId && (
                        <span className="ml-1 text-xs text-fg/50">(chore since deleted)</span>
                      )}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-sm italic text-fg/65">“{entry.note}”</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {entry.reactions.map((r) => {
                        const mine = r.userIds.includes(meId);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction(entry, r.emoji)}
                            className={
                              "chip transition " +
                              (mine
                                ? "bg-accent text-base"
                                : "bg-fg/5 text-fg/80 hover:bg-fg/10")
                            }
                            title={r.userIds
                              .map((u) => byId.get(u)?.name ?? "Someone")
                              .join(", ")}
                          >
                            {r.emoji} {r.userIds.length}
                          </button>
                        );
                      })}

                      {/* Always rendered: discoverable, and reachable without
                          a hover state on touch devices. */}
                      <div className="flex items-center gap-0.5">
                        {REACTIONS.filter(
                          (e) => !entry.reactions.some((r) => r.emoji === e)
                        ).map((e) => (
                          <button
                            key={e}
                            onClick={() => toggleReaction(entry, e)}
                            className="rounded-full px-1.5 py-0.5 text-sm opacity-40 grayscale transition hover:bg-fg/5 hover:opacity-100 hover:grayscale-0 focus:opacity-100 focus:grayscale-0"
                            aria-label={`React ${e}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-fg/55">{formatRel(entry.at)}</span>
                    <button
                      onClick={() => undo(entry)}
                      className="btn btn-ghost text-xs text-fg/55 transition hover:text-rose focus:text-rose group-hover:text-fg/80"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cursor && (
        <div className="mt-4 text-center">
          <button onClick={loadMore} className="btn btn-outline" disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Show older"}
          </button>
        </div>
      )}
    </div>
  );
}
