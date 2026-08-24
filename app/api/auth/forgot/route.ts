import { z } from "zod";
import { randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { handle, json, body } from "@/lib/api";
import { sendEmail, resetEmail } from "@/lib/email";
import { sha256 } from "@/lib/tokens";

export const runtime = "nodejs";

const Input = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

const TTL_MS = 60 * 60 * 1000; // one hour

export const POST = handle(async (req: Request) => {
  const { email } = Input.parse(await body(req));

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always answer the same way. Telling an anonymous caller whether an address
  // has an account here would turn this endpoint into an account-enumeration
  // oracle, so the work below happens quietly or not at all.
  if (user) {
    const existing = await db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    // Cheap rate limit: a handful of live tokens is plenty, and it stops this
    // route being used to spam someone's inbox.
    if (existing.length < 3) {
      const token = randomBytes(32).toString("base64url");

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        // Only the hash is stored — see lib/db/schema.ts.
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + TTL_MS),
      });

      const link = `${originOf(req)}/reset?token=${token}`;
      const mail = resetEmail(user.name, link);
      await sendEmail({ to: user.email, ...mail });
    }
  }

  return json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });
});

/** Build the link from the incoming request so it works on any deployment URL. */
function originOf(req: Request): string {
  const explicit = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}
