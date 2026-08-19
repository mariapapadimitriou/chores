import { NextResponse } from "next/server";
import { mutate, id } from "@/lib/store";
import type { Assignment, Cadence } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const cadence: Cadence = ["once", "daily", "weekly", "monthly"].includes(body.cadence)
    ? body.cadence
    : "once";
  const assignment: Assignment = ["anyone", "fixed", "rotate"].includes(body.assignment)
    ? body.assignment
    : "anyone";
  const assigneeId = assignment === "fixed" ? body.assigneeId ?? null : null;
  const notes = body.notes ? String(body.notes) : undefined;

  const state = await mutate((s) => {
    s.chores.unshift({
      id: id(),
      title,
      notes,
      assigneeId,
      assignment,
      cadence,
      createdAt: Date.now(),
    });
  });
  return NextResponse.json(state);
}
