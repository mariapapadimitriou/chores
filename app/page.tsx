import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    emoji: "🏠",
    title: "One board per group",
    body: "Make a group for your apartment, share the invite code, and everyone lands on the same list.",
  },
  {
    emoji: "🔁",
    title: "Turns that take care of themselves",
    body: "Mark a chore as rotating and Chorella tracks whose turn is next, so nobody has to keep score.",
  },
  {
    emoji: "⏰",
    title: "Nudges, not nagging",
    body: "Chores drift to the top as they get overdue. Snooze the ones that genuinely can wait.",
  },
  {
    emoji: "📊",
    title: "An honest picture",
    body: "A running history of who did what, plus a fairness split so the load stays visible.",
  },
];

export default async function Landing() {
  if (await currentUserId()) redirect("/app");

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1">
          <Link href="/login" className="btn btn-ghost text-sm">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary text-sm">
            Sign up
          </Link>
        </nav>
      </header>

      <section className="mx-auto mt-20 max-w-2xl text-center sm:mt-28">
        <div className="text-xs uppercase tracking-[0.2em] text-fg/60">
          Shared chores, settled
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          The housework, split
          <br />
          without the arguments.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-fg/70">
          Chorella keeps one shared board for everyone you live with — what needs
          doing, whose turn it is, and who actually did it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn btn-primary px-6 py-3">
            Create your group
          </Link>
          <Link href="/login" className="btn btn-outline px-6 py-3">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="text-2xl">{f.emoji}</div>
            <h2 className="mt-3 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-fg/70">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-20 text-center text-xs text-fg/55">
        Made with 🍵 for people who share a kitchen.
      </footer>
    </div>
  );
}
