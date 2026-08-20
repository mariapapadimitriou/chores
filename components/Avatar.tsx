import type { Profile } from "@/lib/types";

const SIZES = {
  xs: "h-6 w-6 text-xs",
  sm: "h-7 w-7 text-sm",
  md: "h-9 w-9 text-lg",
  lg: "h-12 w-12 text-2xl",
} as const;

export function Avatar({
  person,
  size = "md",
  faded = false,
  className = "",
}: {
  person: Pick<Profile, "emoji" | "color" | "name"> | null | undefined;
  size?: keyof typeof SIZES;
  /** Tinted background instead of solid — for use on light rows. */
  faded?: boolean;
  className?: string;
}) {
  const emoji = person?.emoji ?? "•";
  const color = person?.color ?? "#999999";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${SIZES[size]} ${className}`}
      style={
        faded
          ? { background: color + "22", color }
          : { background: color, color: "#FFFDF8" }
      }
      title={person?.name}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

export function PersonChip({ person, prefix }: { person: Profile; prefix?: string }) {
  return (
    <span
      className="chip"
      style={{ background: person.color + "22", color: person.color }}
    >
      {prefix ? `${prefix} ` : ""}
      {person.emoji} {person.name}
    </span>
  );
}
