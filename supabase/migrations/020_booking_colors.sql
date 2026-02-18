-- Add color field to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- Auto-assign colors to existing bookings based on row number
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM bookings
  WHERE color IS NULL
)
UPDATE bookings 
SET color = CASE (numbered.rn % 8)
  WHEN 0 THEN '#10B981'
  WHEN 1 THEN '#F59E0B'
  WHEN 2 THEN '#3B82F6'
  WHEN 3 THEN '#EC4899'
  WHEN 4 THEN '#8B5CF6'
  WHEN 5 THEN '#EF4444'
  WHEN 6 THEN '#14B8A6'
  WHEN 7 THEN '#6366F1'
END
FROM numbered
WHERE bookings.id = numbered.id;
