"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "", label: "Board" },
  { slug: "activity", label: "Activity" },
  { slug: "stats", label: "Stats" },
  { slug: "shopping", label: "Shopping" },
  { slug: "settings", label: "Settings" },
];

export function GroupNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const base = `/g/${groupId}`;

  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-1 border-b border-ink/10 pb-px">
        {TABS.map((t) => {
          const href = t.slug ? `${base}/${t.slug}` : base;
          const active = pathname === href;
          return (
            <Link
              key={t.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "relative px-3 py-2 text-sm transition " +
                (active
                  ? "font-medium text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-ink"
                  : "text-ink/50 hover:text-ink")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
