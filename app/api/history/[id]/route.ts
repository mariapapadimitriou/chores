import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const state = await mutate((s) => {
    s.history = s.history.filter((h) => h.id !== params.id);
  });
  return NextResponse.json(state);
}
