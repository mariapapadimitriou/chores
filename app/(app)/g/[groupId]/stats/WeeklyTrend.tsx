import { formatDate } from "@/lib/chore-logic";

/**
 * One series over time, so: a single hue (categorical slot 1), no legend — the
 * heading names the series — and selective direct labels rather than a number
 * on every column. Values are also in the table view on the page, so the
 * native <title> tooltips enhance rather than gate.
 */
const SERIES = "#4FC3E8";

const W = 400;
const PLOT_TOP = 12;
const PLOT_H = 104;
const AXIS_Y = PLOT_TOP + PLOT_H;
const H = AXIS_Y + 34; // leave room for the x-axis band, don't clip it
const GAP = 6;

export function WeeklyTrend({ weeks }: { weeks: { start: number; total: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const slot = W / weeks.length;
  const barW = slot - GAP;
  const peak = weeks.reduce((a, b) => (b.total > a.total ? b : a), weeks[0]);

  // Two hairlines are enough context for counts this small.
  const ticks = [max, Math.round(max / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Chores completed per week: ${weeks
          .map((w) => `week of ${formatDate(w.start)}, ${w.total}`)
          .join("; ")}`}
      >
        {ticks.map((t) => {
          const y = AXIS_Y - (t / max) * PLOT_H;
          return (
            <g key={t}>
              <line
                x1="0"
                x2={W}
                y1={y}
                y2={y}
                stroke="rgba(233,239,250,0.10)"
                strokeWidth="1"
              />
              <text x="2" y={y - 4} fontSize="9" fill="rgba(233,239,250,0.55)">
                {t}
              </text>
            </g>
          );
        })}

        <line
          x1="0"
          x2={W}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke="rgba(233,239,250,0.22)"
          strokeWidth="1"
        />

        {weeks.map((w, i) => {
          const x = i * slot + GAP / 2;
          const h = w.total ? Math.max(3, (w.total / max) * PLOT_H) : 0;
          const y = AXIS_Y - h;
          const isPeak = w.total === peak.total && w.total > 0;
          return (
            <g key={w.start}>
              {h > 0 && (
                <path
                  d={roundedTop(x, y, barW, h, 4)}
                  fill={SERIES}
                  opacity={isPeak ? 1 : 0.75}
                >
                  <title>{`Week of ${formatDate(w.start)}: ${w.total} ${
                    w.total === 1 ? "chore" : "chores"
                  }`}</title>
                </path>
              )}
              {isPeak && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  fill="rgba(233,239,250,0.9)"
                >
                  {w.total}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={AXIS_Y + 14}
                fontSize="9"
                textAnchor="middle"
                fill="rgba(233,239,250,0.6)"
              >
                {formatDate(w.start)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        Column chart of chores completed each week for the last {weeks.length} weeks.
        The same figures are listed in the table view on this page.
      </figcaption>
    </figure>
  );
}

/** Bars sit on the baseline, so only the top corners round. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + rr}`,
    `Q ${x} ${y} ${x + rr} ${y}`,
    `L ${x + w - rr} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rr}`,
    `L ${x + w} ${y + h}`,
    "Z",
  ].join(" ");
}
