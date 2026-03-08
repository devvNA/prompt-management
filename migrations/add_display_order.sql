-- Add display_order column for drag-and-drop reordering
-- Run this in your Supabase SQL editor before using the reorder feature.

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS display_order integer;

-- Optional: initialize display_order based on existing created_at order
-- (newest first, matching current default sort)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
  FROM prompts
)
UPDATE prompts
SET display_order = ordered.rn
FROM ordered
WHERE prompts.id = ordered.id;
