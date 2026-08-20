# Chorella

Shared chores for the people you live with. Sign up, build a profile, then
create or join a group — each group gets one board that everybody in it sees.

## Features

- **Accounts & profiles** — email + password, with an emoji and colour that
  identify you across every board you're in.
- **Groups** — create a household, share an 8-character invite code, and
  everyone lands on the same board. One account can be in many groups.
- **The board** — chores grouped by cadence (daily / weekly / monthly /
  one-off), sorted most-overdue-first, with amber "due today" and red "N days
  late" states. Snooze a cycle when something genuinely can wait.
- **Rotation** — mark a chore "rotate" and Chorella tracks whose turn is next,
  cycling members in join order.
- **My chores** — everything currently pointed at you, across every group.
- **Activity** — a full history of who did what, with notes and reactions.
  Deleting a chore never erases the record that someone did it.
- **Stats** — per-member totals, fairness share, an 8-week trend, and a table
  view of every figure on the page.
- **Shopping list** — a shared list per group with the same check-off
  mechanic, crediting whoever actually bought the thing.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Postgres via Drizzle ORM — Neon's HTTP driver in production, plain
  postgres.js anywhere else, chosen automatically from `DATABASE_URL`
- Auth.js v5 (Credentials + JWT sessions), bcrypt-hashed passwords
- Zod on every request body

## Running locally

You need a Postgres database. Any will do — a local cluster is fine.

```bash
cp .env.example .env.local     # then fill in DATABASE_URL and AUTH_SECRET
npm install
npx drizzle-kit push           # create the tables
npm run dev
```

Generate a session secret with `openssl rand -base64 32`.

## Deploying

1. Create a Neon Postgres database (Vercel dashboard → **Storage** →
   **Marketplace** → **Neon**) and attach it to the project.
2. Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_TRUST_HOST=true`.
3. Run `npx drizzle-kit push` once against the production database.
4. Deploy.

## Notes on the design

**Authorization.** Every group-scoped route and page opens with
`requireMember` or `requireOwner` from `lib/auth-guard.ts`. A route that reads
a `groupId` without one of those guards is a data leak. `requireMember`
returns the same 403 whether the group doesn't exist or you simply aren't in
it, so it never confirms another household exists.

**Attribution comes from the session**, never a request body — you cannot log
a chore, or claim a shopping item, as someone else.

**History outlives its subject.** `completions.chore_id` is `ON DELETE SET
NULL` with the chore's title snapshotted alongside it, so deleting a chore
keeps the record of everyone who ever did it. Likewise `chores.assignee_id`,
so someone leaving doesn't take their chores with them.

**The member palette is validated, not eyeballed.** `AVATAR_COLORS` in
`lib/types.ts` doubles as the categorical chart palette on the stats page, and
that exact set and order passes all six checks of the dataviz palette
validator (lightness band, chroma floor, CVD separation, normal-vision floor,
contrast) against the `#FFFDF8` surface. Re-run the validator before changing
it. Charts also direct-label every bar, so identity never rests on colour
alone, and every figure has a table-view equivalent.
