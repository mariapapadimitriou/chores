"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || mismatch || password.length < 8) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mx-auto mb-8">
        <Logo />
      </Link>

      <div className="card p-6 sm:p-8">
        {!token ? (
          <div className="text-center">
            <div className="text-4xl">🔗</div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Link incomplete</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg/70">
              This page needs the reset link from your email. Try opening it again, or
              request a fresh one.
            </p>
            <Link href="/forgot" className="btn btn-primary mt-6">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="text-4xl">🎉</div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">All set</h1>
            <p className="mt-2 text-sm text-fg/70">
              Your password is updated. Taking you to the log in page…
            </p>
            <Link href="/login" className="btn btn-outline mt-6">
              Log in now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
            <p className="mt-1 text-sm text-fg/65">
              Make it something you&apos;ll remember this time.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="field-label" htmlFor="pw">
                  New password
                </label>
                <input
                  id="pw"
                  type="password"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="pw2">
                  Confirm it
                </label>
                <input
                  id="pw2"
                  type="password"
                  className="w-full"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {mismatch && (
                  <p className="mt-1 text-xs text-rose">Those two don&apos;t match yet.</p>
                )}
              </div>

              {error && (
                <p className="rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
                  {error}{" "}
                  <Link href="/forgot" className="underline underline-offset-2">
                    Request a new link
                  </Link>
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full py-3"
                disabled={busy || mismatch || password.length < 8}
              >
                {busy ? "Saving…" : "Set new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
