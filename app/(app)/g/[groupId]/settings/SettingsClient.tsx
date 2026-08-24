"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/chore-logic";
import type { Group, Member } from "@/lib/types";

export function SettingsClient({ meId, initial }: { meId: string; initial: Group }) {
  const router = useRouter();
  const [group, setGroup] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = group.role === "owner";
  const base = `/api/groups/${group.id}`;

  async function call(path: string, init: RequestInit) {
    setError(null);
    const res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return null;
    }
    return data;
  }

  async function rename() {
    if (name.trim() === group.name || !name.trim()) return;
    setBusy("rename");
    const data = await call(base, {
      method: "PATCH",
      body: JSON.stringify({ name: name.trim() }),
    });
    if (data) {
      setGroup(data);
      router.refresh();
    }
    setBusy(null);
  }

  async function regenerate() {
    if (
      !confirm("Generate a new invite code?\n\nThe old one stops working immediately.")
    )
      return;
    setBusy("code");
    const data = await call(base, {
      method: "PATCH",
      body: JSON.stringify({ regenerateInviteCode: true }),
    });
    if (data) setGroup(data);
    setBusy(null);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Couldn't reach the clipboard — copy the code by hand.");
    }
  }

  async function setRole(m: Member, role: "owner" | "member") {
    setBusy(m.id);
    const members = await call(`${base}/members/${m.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (members) setGroup({ ...group, members });
    setBusy(null);
  }

  async function remove(m: Member) {
    if (!confirm(`Remove ${m.name} from ${group.name}?\n\nTheir past chores stay in the history.`))
      return;
    setBusy(m.id);
    const members = await call(`${base}/members/${m.id}`, { method: "DELETE" });
    if (members) setGroup({ ...group, members });
    setBusy(null);
  }

  async function leave() {
    if (!confirm(`Leave ${group.name}?`)) return;
    setBusy("leave");
    const ok = await call(`${base}/leave`, { method: "POST" });
    setBusy(null);
    if (ok) {
      router.push("/app/groups");
      router.refresh();
    }
  }

  async function destroy() {
    if (
      !confirm(
        `Delete ${group.name} permanently?\n\nEvery chore, completion and shopping item goes with it. This cannot be undone.`
      )
    )
      return;
    setBusy("delete");
    const ok = await call(base, { method: "DELETE" });
    setBusy(null);
    if (ok) {
      router.push("/app/groups");
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Invite people</h2>
        <p className="mt-1 text-sm text-fg/65">
          Anyone with this code can join the group and see the board.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-xl border border-fg/15 bg-base px-4 py-3 font-mono text-lg tracking-[0.3em]">
            {group.inviteCode}
          </code>
          <button onClick={copyCode} className="btn btn-outline">
            {copied ? "Copied ✓" : "Copy"}
          </button>
          {isOwner && (
            <button
              onClick={regenerate}
              className="btn btn-ghost text-sm"
              disabled={busy === "code"}
            >
              {busy === "code" ? "Generating…" : "Generate new code"}
            </button>
          )}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-fg/65">
          Join order sets the turn order for rotating chores.
        </p>
        <ul className="mt-4 divide-y divide-fg/5">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Avatar person={m} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.id === meId && <span className="text-xs text-fg/55">you</span>}
                  {m.role === "owner" && (
                    <span className="chip bg-fg/5 text-fg/70">owner</span>
                  )}
                </div>
                <div className="text-xs text-fg/55">
                  Joined {formatDate(m.joinedAt)}
                </div>
              </div>

              {isOwner && m.id !== meId && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setRole(m, m.role === "owner" ? "member" : "owner")}
                    className="btn btn-ghost text-xs"
                    disabled={busy === m.id}
                  >
                    {m.role === "owner" ? "Make member" : "Make owner"}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="btn btn-danger text-xs"
                    disabled={busy === m.id}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Group name</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="min-w-0 flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              aria-label="Group name"
            />
            <button
              onClick={rename}
              className="btn btn-primary"
              disabled={busy === "rename" || !name.trim() || name.trim() === group.name}
            >
              {busy === "rename" ? "Saving…" : "Save"}
            </button>
          </div>
        </section>
      )}

      <section className="card border-rose/20 p-5 sm:p-6">
        <h2 className="font-semibold">Leaving</h2>
        <p className="mt-1 text-sm text-fg/65">
          {isOwner
            ? "Hand ownership to someone else before you leave, or delete the group outright."
            : "You can rejoin later with the invite code. Your history stays put."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={leave} className="btn btn-outline" disabled={busy === "leave"}>
            {busy === "leave" ? "Leaving…" : "Leave group"}
          </button>
          {isOwner && (
            <button onClick={destroy} className="btn btn-danger" disabled={busy === "delete"}>
              {busy === "delete" ? "Deleting…" : "Delete group"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
