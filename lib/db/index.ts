import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Create a Neon database (Vercel → Storage → Neon) " +
      "and add its connection string to your environment."
  );
}

// Neon's HTTP driver only speaks to *.neon.tech. Anything else (local Postgres
// in dev, or another managed provider) goes over plain TCP via postgres.js.
// Both expose the same Drizzle query builder, so the rest of the app is
// driver-agnostic — hence the cast to a single type.
const isNeon = /\.neon\.tech/.test(url);

function createDb(): PostgresJsDatabase<typeof schema> {
  if (isNeon) {
    return drizzleNeon(neon(url!), { schema }) as unknown as PostgresJsDatabase<
      typeof schema
    >;
  }
  // Reuse one pool across hot reloads in dev, otherwise every recompile leaks
  // connections until Postgres refuses new ones.
  const g = globalThis as { __chorellaSql?: ReturnType<typeof postgres> };
  const sql = g.__chorellaSql ?? postgres(url!, { max: 5 });
  if (process.env.NODE_ENV !== "production") g.__chorellaSql = sql;
  return drizzlePg(sql, { schema });
}

export const db = createDb();
export { schema };
