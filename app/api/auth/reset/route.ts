import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { handle, json, body } from "@/lib/api";
import { sha256 } from "@/lib/tokens";

export const runtime = "nodejs";

const Input = z.object({
  token: z.string().min(1, "That reset link is not valid."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const POST = handle(async (req: Request) => {
  const { token, password } = Input.parse(await body(req));

  // Unused, unexpired, and matching the stored hash — all three, or nothing.
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, sha256(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return json(
      { error: "That reset link has expired or has already been used." },
      400
    );
  }

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 10) })
    .where(eq(users.id, row.userId));

  // Burn this token, and any other live one for the account: whoever just set
  // the password is done, and older links should stop working immediately.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, row.userId),
        isNull(passwordResetTokens.usedAt)
      )
    );

  return json({ ok: true });
});
