-- Password reset table, as ONE statement.
--
-- Drizzle's generated 0001_password_reset.sql contains four separate commands.
-- Some SQL consoles send a whole paste through the extended query protocol,
-- which permits exactly one command and fails with
--   "cannot insert multiple commands into a prepared statement".
-- Wrapping the DDL in a PL/pgSQL block makes it a single command, and the
-- IF NOT EXISTS guards make it safe to run more than once.

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id"    uuid NOT NULL
                 REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at"    timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_token_hash_idx"
    ON "password_reset_tokens" USING btree ("token_hash");

  CREATE INDEX IF NOT EXISTS "password_reset_user_idx"
    ON "password_reset_tokens" USING btree ("user_id");
END $$;
