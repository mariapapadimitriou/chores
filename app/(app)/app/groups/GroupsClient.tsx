"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GroupSummary } from "@/lib/types";

export function GroupsClient({ initial }: { initial: GroupSummary[] }) {
  const router = useRouter();
  const [groups] = useState(initial);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Could not create the group.");
      router.push(`/g/${data.id}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy("join");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Could not join that group.");
      if (data.alreadyMember) setNotice(`You're already in ${data.name}.`);
      router.push(`/g/${data.id}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-fg/60">Your households</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Groups</h1>
      </header>

      {groups.length > 0 && (
        <ul className="mb-8 space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/g/${g.id}`}
                className="card card-lift flex items-center gap-4 p-4 transition hover:border-fg/25"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{g.name}</span>
                    {g.role === "owner" && (
                      <span className="chip bg-fg/5 text-fg/70">owner</span>
                    )}
                    {g.overdueCount > 0 && (
                      <span className="chip bg-rose/15 text-rose">
                        {g.overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-fg/55">
                    {g.memberCount} {g.memberCount === 1 ? "person" : "people"} ·{" "}
                    {g.choreCount} {g.choreCount === 1 ? "chore" : "chores"}
                  </div>
                </div>
                <span className="text-fg/50" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mb-4 rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-2xl bg-sky/10 px-3 py-2 text-sm text-sky">{notice}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={create} className="card p-5">
          <h2 className="font-semibold">Start a group</h2>
          <p className="mt-1 text-sm text-fg/65">
            You&apos;ll get an invite code to share with everyone you live with.
          </p>
          <input
            className="mt-4 w-full"
            placeholder="The Apartment"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-label="Group name"
          />
          <button
            type="submit"
            className="btn btn-primary mt-3 w-full"
            disabled={!name.trim() || busy !== null}
          >
            {busy === "create" ? "Creating…" : "Create group"}
          </button>
        </form>

        <form onSubmit={join} className="card p-5">
          <h2 className="font-semibold">Join a group</h2>
          <p className="mt-1 text-sm text-fg/65">
            Got a code from a housemate? Drop it in here.
          </p>
          <input
            className="mt-4 w-full font-mono uppercase tracking-widest"
            placeholder="ABCD2345"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={12}
            aria-label="Invite code"
          />
          <button
            type="submit"
            className="btn btn-outline mt-3 w-full"
            disabled={!code.trim() || busy !== null}
          >
            {busy === "join" ? "Joining…" : "Join group"}
          </button>
        </form>
      </div>
    </div>
  );
}
