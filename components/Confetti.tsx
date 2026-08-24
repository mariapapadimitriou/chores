"use client";

import { useEffect, useState } from "react";

const COLORS = ["#D2691E", "#2B62C9", "#5A8F1A", "#8A3FB0", "#0092AD", "#BE2F4F"];
const PIECES = 12;

/**
 * A one-shot burst of paper, anchored to whatever it is rendered inside.
 * Purely decorative and aria-hidden; it never gates or conveys information,
 * and the reduced-motion rule in globals.css collapses it to nothing.
 */
export function Confetti({ fire }: { fire: number }) {
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (fire > 0) setBurst(fire);
  }, [fire]);

  if (!burst) return null;

  return (
    <span
      key={burst}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {Array.from({ length: PIECES }).map((_, i) => {
        // Spread the pieces evenly around the circle, with a little jitter so
        // repeat bursts don't look identical.
        const angle = (i / PIECES) * Math.PI * 2 + (burst % 7) * 0.21;
        const distance = 34 + ((i * 13) % 22);
        return (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                background: COLORS[i % COLORS.length],
                animationDelay: `${(i % 4) * 22}ms`,
                "--dx": `${Math.cos(angle) * distance}px`,
                "--dy": `${Math.sin(angle) * distance - 12}px`,
                "--rot": `${(i % 2 ? 1 : -1) * (120 + i * 24)}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
