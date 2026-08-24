"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Try again?");
        return;
      }
      setSent(true);
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
        {sent ? (
          <div className="text-center">
            <div className="text-4xl">📬</div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              If <span className="font-medium text-ink">{email}</span> has a Chorella
              account, a reset link is on its way. It works once and expires in an hour.
            </p>
            <Link href="/login" className="btn btn-outline mt-6">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
            <p className="mt-1 text-sm text-ink/55">
              Pop your email in and we&apos;ll send you a link to set a new one.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <p className="rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink/55">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
