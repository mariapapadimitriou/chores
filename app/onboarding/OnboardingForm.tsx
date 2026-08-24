"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { ColorPicker, EmojiPicker } from "@/components/AvatarPicker";
import type { Profile } from "@/lib/types";

export function OnboardingForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [color, setColor] = useState(initial.color);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          color,
          completeOnboarding: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save your profile.");
        return;
      }
      router.push("/app/groups");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const preview: Profile = { id: initial.id, name: name || "You", emoji, color };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="mx-auto mb-8">
        <Logo />
      </div>

      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Make it yours</h1>
        <p className="mt-1 text-sm text-fg/65">
          Your housemates will spot you by this colour and emoji all over the board.
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-fg/10 p-4">
          <Avatar person={preview} size="lg" />
          <div className="min-w-0 flex-1">
            <label className="field-label" htmlFor="ob-name">
              Display name
            </label>
            <input
              id="ob-name"
              className="w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria"
              maxLength={60}
            />
          </div>
        </div>

        <div className="mt-6">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <div className="mt-5">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={save}
          className="btn btn-primary mt-7 w-full py-3"
          disabled={busy || !name.trim()}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
