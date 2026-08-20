import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth-guard";
import { handle, json, body } from "@/lib/api";
import type { Me } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toMe = (u: {
  id: string;
  name: string;
  email: string;
  emoji: string;
  color: string;
  onboardedAt: Date | null;
}): Me => ({
  id: u.id,
  name: u.name,
  email: u.email,
  emoji: u.emoji,
  color: u.color,
  onboarded: !!u.onboardedAt,
});

export const GET = handle(async () => {
  const user = await requireUser();
  return json(toMe(user));
});

const PatchInput = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  emoji: z.string().trim().min(1).max(8).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #5B8CBE.")
    .optional(),
  completeOnboarding: z.boolean().optional(),
});

export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  const input = PatchInput.parse(await body(req));

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.emoji !== undefined) patch.emoji = input.emoji;
  if (input.color !== undefined) patch.color = input.color;
  if (input.completeOnboarding) patch.onboardedAt = new Date();

  if (!Object.keys(patch).length) return json(toMe(user));

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, user.id))
    .returning();

  return json(toMe(updated));
});
