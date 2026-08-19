# Our Chores

A tiny shared chore board for a two-person apartment. Add chores, mark them
done, and keep a running history of who did what.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Shared state via [`@upstash/redis`](https://docs.upstash.com/redis) — a single JSON blob
- Falls back to in-memory storage locally so `next dev` works without any setup

## Local dev

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. State lives in memory and resets on restart.

## Deploy

Deployed to Vercel. To get real shared persistence:

1. In the Vercel dashboard for this project, open **Storage → Marketplace →
   Upstash for Redis** and create a free database.
2. Attach it to the project — Vercel injects `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` automatically (`KV_REST_API_URL` / `KV_REST_API_TOKEN`
   from the legacy KV integration also work).
3. Redeploy. That's it — everyone who visits the URL sees the same board.

Without a database attached, each cold start begins from a fresh default board.

## Model

- **Roommates** — two by default; rename / recolor in Settings.
- **Chores** — title, cadence (once / daily / weekly / monthly), optional
  assignee and notes.
- **History** — every completion is logged with who + when (capped at the
  most recent 500).
- **This week** — count of chores each roommate completed since Monday.
