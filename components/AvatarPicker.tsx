"use client";

import { AVATAR_COLORS, AVATAR_EMOJI } from "@/lib/types";

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="field-label">Emoji</div>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATAR_EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-label={`Choose ${e}`}
            aria-pressed={value === e}
            className={
              "flex h-9 items-center justify-center rounded-xl text-lg transition " +
              (value === e
                ? "bg-accent text-base"
                : "border border-fg/10 hover:border-fg/40")
            }
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Someone who picked from an older palette keeps their colour as an extra
  // swatch, so the picker still shows what they actually have selected.
  const swatches = AVATAR_COLORS.includes(value)
    ? AVATAR_COLORS
    : [...AVATAR_COLORS, value];

  return (
    <div>
      <div className="field-label">Colour</div>
      <div className="flex flex-wrap gap-2">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Choose colour ${c}`}
            aria-pressed={value === c}
            className={
              "h-9 w-9 rounded-full transition " +
              (value === c ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : "")
            }
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
