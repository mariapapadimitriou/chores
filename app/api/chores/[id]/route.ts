import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const state = await mutate((s) => {
    const c = s.chores.find((c) => c.id === params.id);
    if (!c) return;
    if (typeof body.title === "string") c.title = body.title.trim();
    if (typeof body.notes === "string") c.notes = body.notes;
    if ("assigneeId" in body) c.assigneeId = body.assigneeId ?? null;
    if (body.cadence && ["once", "daily", "weekly", "monthly"].includes(body.cadence))
      c.cadence = body.cadence;
    if (typeof body.archived === "boolean") c.archived = body.archived;
  });
  return NextResponse.json(state);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const state = await mutate((s) => {
    s.chores = s.chores.filter((c) => c.id !== params.id);
  });
  return NextResponse.json(state);
}
