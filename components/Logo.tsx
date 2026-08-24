export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="chorella-mark" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0" stopColor="#4FC3E8" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#chorella-mark)" />
        <path
          d="M9 16.5l4.2 4.2L23 11"
          stroke="#08131C"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">Chorella</span>
    </span>
  );
}
