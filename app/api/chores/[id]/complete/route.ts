import { NextResponse } from "next/server";
import { mutate, id } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const byId = String(body.byId ?? "");
  const note = body.note ? String(body.note) : undefined;
  if (!byId) return NextResponse.json({ error: "byId required" }, { status: 400 });

  const state = await mutate((s) => {
    const chore = s.chores.find((c) => c.id === params.id);
    if (!chore) return;
    s.history.unshift({
      id: id(),
      choreId: chore.id,
      choreTitle: chore.title,
      byId,
      at: Date.now(),
      note,
    });
    // Keep the history bounded so KV doesn't grow forever.
    if (s.history.length > 500) s.history.length = 500;
  });
  return NextResponse.json(state);
}
