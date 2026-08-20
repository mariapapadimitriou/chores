import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";

export const runtime = "nodejs";

const Input = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = Input.parse(await body(req));

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return json({ error: "That is not your current password." }, 403);

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(newPassword, 10) })
    .where(eq(users.id, user.id));

  return json({ ok: true });
});
