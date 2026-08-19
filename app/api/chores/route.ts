import { NextResponse } from "next/server";
import { mutate, id } from "@/lib/store";
import type { Cadence } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const cadence: Cadence = ["once", "daily", "weekly", "monthly"].includes(body.cadence)
    ? body.cadence
    : "once";
  const assigneeId = body.assigneeId ?? null;
  const notes = body.notes ? String(body.notes) : undefined;

  const state = await mutate((s) => {
    s.chores.unshift({
      id: id(),
      title,
      notes,
      assigneeId,
      cadence,
      createdAt: Date.now(),
    });
  });
  return NextResponse.json(state);
}
