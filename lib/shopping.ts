import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shoppingItems } from "@/lib/db/schema";
import type { ShoppingItem } from "@/lib/types";

export function toItem(r: typeof shoppingItems.$inferSelect): ShoppingItem {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    addedBy: r.addedBy,
    boughtBy: r.boughtBy,
    boughtAt: r.boughtAt ? r.boughtAt.getTime() : null,
    createdAt: r.createdAt.getTime(),
  };
}

export async function listItems(groupId: string): Promise<ShoppingItem[]> {
  const rows = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.groupId, groupId))
    .orderBy(desc(shoppingItems.createdAt));
  return rows.map(toItem);
}
