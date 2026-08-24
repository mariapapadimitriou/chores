# Deploying Chorella (free tier)

The app is built and deployed; it needs a database and two secrets before
anyone can sign up. All three steps are free and take about five minutes.

## 1. Create the database

Vercel dashboard → project **chorella-app** → **Storage** → **Create Database**
→ **Neon** → choose the **Free** plan → **Connect**.

Vercel sets `DATABASE_URL` on the project automatically. Nothing to copy.

> Free plan: 0.5 GB storage and an endpoint that auto-suspends when idle.
> This app is far below that — the whole schema is empty tables plus a row
> per chore and completion.

## 2. Add two environment variables

Project → **Settings** → **Environment Variables**. Add both to *all*
environments (Production, Preview, Development):

| Name | Value |
|---|---|
| `AUTH_SECRET` | generate one with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |

## 3. Create the tables

Open the Neon console (Vercel → Storage → your database → **Open in Neon**),
go to the **SQL Editor**, and paste the contents of
[`drizzle/0000_init.sql`](drizzle/0000_init.sql). Run it once.

That file is generated from `lib/db/schema.ts` and has been applied to a clean
Postgres 16 database and verified — 7 tables, all foreign keys, and the two
delete rules the app depends on (`completions.chore_id` and
`chores.assignee_id` are both `ON DELETE SET NULL`, so history and chores
survive deletions).

Equivalent if you'd rather use a terminal:

```bash
DATABASE_URL='<neon connection string>' npx drizzle-kit push
```

## 3b. Password reset table (added later)

Password reset needs one more table. Run `drizzle/0001_password_reset.sql` in
the Neon SQL editor the same way. Without it, `/forgot` returns a 500.

## 4. Redeploy

Deployments → latest → **Redeploy**. The env vars are only picked up by a new
build.

Then: sign up, pick an emoji and colour, create a group, and share the invite
code.

## Keeping it free

- **Vercel Hobby** — free, no card. This app adds no cron jobs, uses no
  `next/image` optimization, and has no paid dependencies.
- **Neon Free** — the board only polls while its tab is actually visible, so a
  backgrounded tab lets the database endpoint auto-suspend instead of being
  held awake.
- Nothing in the project requires a Pro upgrade, credits, or add-ons.


## Optional: sending reset emails

Password reset works without any of this — the link is written to the Vercel
runtime logs, so you can copy it out. To actually deliver mail:

1. Create a free **Resend** account (3,000 emails/month).
2. Verify a domain you own, under *Domains*. This is the part that cannot be
   skipped: without a verified domain Resend only delivers to the address that
   owns the account, so Stais and Costa would never receive anything.
3. Add two environment variables to the Vercel project:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the key from Resend |
| `EMAIL_FROM` | e.g. `Chorella <hello@yourdomain.com>` |

4. Redeploy.
