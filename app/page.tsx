import Board from "./Board";
import { getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getState();
  return <Board initial={initial} />;
}
