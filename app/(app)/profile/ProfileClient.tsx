"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ColorPicker, EmojiPicker } from "@/components/AvatarPicker";
import type { Me } from "@/lib/types";

export function ProfileClient({ initial }: { initial: Me }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [color, setColor] = useState(initial.color);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const dirty =
    name.trim() !== initial.name || emoji !== initial.emoji || color !== initial.color;

  async function saveProfile() {
    if (!dirty || savingProfile || !name.trim()) return;
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErr(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), emoji, color }),
      });
      const data = await res.json();
      if (!res.ok) return setProfileErr(data.error ?? "Could not save.");
      setProfileMsg("Saved.");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (savingPw) return;
    setSavingPw(true);
    setPwMsg(null);
    setPwErr(null);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setPwErr(data.error ?? "Could not change your password.");
      setPwMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-fg/60">Account</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile</h1>
      </header>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">How you appear</h2>
        <p className="mt-1 text-sm text-fg/65">
          This is what your housemates see next to every chore you finish.
        </p>

        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-fg/10 p-4">
          <Avatar person={{ name, emoji, color }} size="lg" />
          <div className="min-w-0 flex-1">
            <label className="field-label" htmlFor="pf-name">
              Display name
            </label>
            <input
              id="pf-name"
              className="w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
        </div>

        <div className="mt-5">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <div className="mt-5">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {profileErr && (
          <p className="mt-4 rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
            {profileErr}
          </p>
        )}
        {profileMsg && (
          <p className="mt-4 rounded-2xl bg-moss/10 px-3 py-2 text-sm text-moss">{profileMsg}</p>
        )}

        <button
          onClick={saveProfile}
          className="btn btn-primary mt-5"
          disabled={!dirty || savingProfile || !name.trim()}
        >
          {savingProfile ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-fg/65">
          Signed in as <span className="text-fg">{initial.email}</span>
        </p>

        <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:max-w-sm">
          <div>
            <label className="field-label" htmlFor="pf-cur">
              Current password
            </label>
            <input
              id="pf-cur"
              type="password"
              className="w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="pf-new">
              New password
            </label>
            <input
              id="pf-new"
              type="password"
              className="w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>

          {pwErr && (
            <p className="rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
              {pwErr}
            </p>
          )}
          {pwMsg && (
            <p className="rounded-2xl bg-moss/10 px-3 py-2 text-sm text-moss">{pwMsg}</p>
          )}

          <button
            type="submit"
            className="btn btn-outline justify-self-start"
            disabled={savingPw || !currentPassword || newPassword.length < 8}
          >
            {savingPw ? "Updating…" : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
