"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/Avatar";
import type { Profile } from "@/lib/types";

export function TopBar({
  me,
  groups,
}: {
  me: Profile;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useParams<{ groupId?: string }>();
  const [open, setOpen] = useState<null | "groups" | "me">(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = groups.find((g) => g.id === params?.groupId);

  return (
    <div ref={wrapRef} className="flex items-center gap-1">
      <div className="relative">
        <button
          onClick={() => setOpen(open === "groups" ? null : "groups")}
          className="btn btn-outline max-w-[45vw] text-sm sm:max-w-none"
          aria-haspopup="menu"
          aria-expanded={open === "groups"}
        >
          <span className="truncate">{active?.name ?? "My groups"}</span>
          <span className="text-ink/40">▾</span>
        </button>

        {open === "groups" && (
          <div
            role="menu"
            className="card rise absolute right-0 z-50 mt-2 w-60 overflow-hidden !rounded-2xl p-1"
          >
            {groups.length === 0 && (
              <p className="px-3 py-3 text-sm text-ink/50">No groups yet.</p>
            )}
            {groups.map((g) => (
              <button
                key={g.id}
                role="menuitem"
                onClick={() => {
                  setOpen(null);
                  router.push(`/g/${g.id}`);
                }}
                className={
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-ink/5 " +
                  (g.id === params?.groupId ? "font-medium" : "")
                }
              >
                <span className="truncate">{g.name}</span>
                {g.id === params?.groupId && <span className="ml-auto text-moss">✓</span>}
              </button>
            ))}
            <div className="my-1 border-t border-ink/10" />
            <Link
              href="/app/groups"
              role="menuitem"
              onClick={() => setOpen(null)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-ink/5"
            >
              + New or join a group
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen(open === "me" ? null : "me")}
          className="rounded-full transition hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={open === "me"}
          aria-label="Account menu"
        >
          <Avatar person={me} size="md" />
        </button>

        {open === "me" && (
          <div
            role="menu"
            className="card rise absolute right-0 z-50 mt-2 w-56 overflow-hidden !rounded-2xl p-1"
          >
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium">{me.name}</div>
              <div className="text-xs text-ink/45">Signed in</div>
            </div>
            <div className="my-1 border-t border-ink/10" />
            <Link
              href="/app"
              role="menuitem"
              onClick={() => setOpen(null)}
              className="block rounded-xl px-3 py-2 text-sm transition hover:bg-ink/5"
            >
              My chores
            </Link>
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(null)}
              className="block rounded-xl px-3 py-2 text-sm transition hover:bg-ink/5"
            >
              Profile &amp; password
            </Link>
            <button
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose transition hover:bg-rose/10"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
