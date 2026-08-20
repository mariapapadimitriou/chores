import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

function build(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a Postgres database (on Vercel: " +
        "Storage → Marketplace → Neon) and add its connection string to the " +
        "project's environment variables."
    );
  }

  // Neon's HTTP driver only speaks to *.neon.tech. Anything else — a local
  // Postgres in dev, or another managed provider — goes over plain TCP via
  // postgres.js. Both expose the same Drizzle query builder, so the rest of
  // the app is driver-agnostic; hence the single return type.
  if (/\.neon\.tech/.test(url)) {
    return drizzleNeon(neon(url), { schema }) as unknown as Db;
  }

  // Reuse one pool across hot reloads in dev, otherwise every recompile leaks
  // connections until Postgres refuses new ones.
  const g = globalThis as { __chorellaSql?: ReturnType<typeof postgres> };
  const sql = g.__chorellaSql ?? postgres(url, { max: 5 });
  if (process.env.NODE_ENV !== "production") g.__chorellaSql = sql;
  return drizzlePg(sql, { schema });
}

let instance: Db | null = null;

/**
 * Connects on first use rather than at import. A missing DATABASE_URL then
 * surfaces as a runtime error on the routes that actually need the database,
 * instead of throwing during the build and taking the whole deploy down with
 * it — the static pages (landing, login, signup) still render.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    if (!instance) instance = build();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
