import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { handle, json, body } from "@/lib/api";
import { AVATAR_COLORS, AVATAR_EMOJI } from "@/lib/types";

export const runtime = "nodejs";

const SignupInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(1, "Tell us your name.").max(60),
});

export const POST = handle(async (req: Request) => {
  const { email, password, name } = SignupInput.parse(await body(req));

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return json({ error: "An account with that email already exists." }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      emoji: pick(AVATAR_EMOJI),
      color: pick(AVATAR_COLORS),
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return json({ id: user.id, email: user.email, name: user.name }, 201);
});
