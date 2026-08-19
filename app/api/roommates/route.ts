import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const body = await req.json();
  const updates = Array.isArray(body.roommates) ? body.roommates : [];
  const state = await mutate((s) => {
    for (const u of updates) {
      const r = s.roommates.find((r) => r.id === u.id);
      if (!r) continue;
      if (typeof u.name === "string" && u.name.trim()) r.name = u.name.trim();
      if (typeof u.emoji === "string" && u.emoji.trim()) r.emoji = u.emoji.trim().slice(0, 4);
      if (typeof u.color === "string") r.color = u.color;
    }
  });
  return NextResponse.json(state);
}
