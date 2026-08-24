"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Could not create your account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isSignup
            ? "Account created, but sign-in failed. Try logging in."
            : "That email and password do not match."
        );
        return;
      }

      // Fresh accounts land on onboarding to pick an avatar; returning users
      // go where they were headed.
      router.push(isSignup ? "/onboarding" : next);
      router.refresh();
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-fg/65">
          {isSignup
            ? "One account, as many households as you need."
            : "Sign in to get back to your board."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isSignup && (
            <div>
              <label className="field-label" htmlFor="name">
                Your name
              </label>
              <input
                id="name"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maria"
                autoComplete="name"
                required
              />
            </div>
          )}

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

          <div>
            <div className="flex items-baseline justify-between">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              {!isSignup && (
                <Link
                  href="/forgot"
                  className="mb-1 text-xs text-fg/60 underline underline-offset-2 hover:text-fg"
                >
                  Forgot it?
                </Link>
              )}
            </div>
            <input
              id="password"
              type="password"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              required
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
            {busy ? "One moment…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-fg/65">
        {isSignup ? "Already have an account? " : "New to Chorella? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-fg underline underline-offset-4"
        >
          {isSignup ? "Log in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
