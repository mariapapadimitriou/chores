-- Dark theme: remap member colours from the light palette to the dark one.
--
-- AVATAR_COLORS was validated against the old cream surface; the dark theme
-- selects its own six from the same hue families, validated against #151D2B.
-- Anyone who picked a colour before this ran is still holding a light-palette
-- hex, which reads muddy on the dark cards, so move each one to its
-- counterpart. A colour that is not in either palette is left alone.
--
-- Safe to run more than once: the new values are not keys in the map.
UPDATE users SET color = CASE color
  WHEN '#D2691E' THEN '#C96A35'  -- orange
  WHEN '#2B62C9' THEN '#1F7FBF'  -- blue
  WHEN '#5A8F1A' THEN '#9DB83A'  -- green  -> lime
  WHEN '#8A3FB0' THEN '#8B93F0'  -- purple -> indigo
  WHEN '#0092AD' THEN '#35B8C9'  -- teal   -> cyan
  WHEN '#BE2F4F' THEN '#FF7A90'  -- rose   -> pink
  -- and the generation before that, from the pre-Chorella board
  WHEN '#4E7C4A' THEN '#9DB83A'  -- moss   -> lime
  WHEN '#5B8CBE' THEN '#1F7FBF'  -- sky    -> blue
  WHEN '#D96E7F' THEN '#FF7A90'  -- rose   -> pink
  WHEN '#C97B4A' THEN '#C96A35'  -- clay   -> orange
  WHEN '#8B6BB1' THEN '#8B93F0'  -- plum   -> indigo
  WHEN '#3F9C9C' THEN '#35B8C9'  -- teal   -> cyan
  ELSE color
END
WHERE color IN (
  '#D2691E', '#2B62C9', '#5A8F1A', '#8A3FB0', '#0092AD', '#BE2F4F',
  '#4E7C4A', '#5B8CBE', '#D96E7F', '#C97B4A', '#8B6BB1', '#3F9C9C'
);
