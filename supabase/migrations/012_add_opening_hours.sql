-- Add opening_hours column to salons table
-- Format: JSON object with days as keys and {open, close, closed} as values
-- Example: {"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}

ALTER TABLE salons ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"10:00","close":"17:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb;

-- Add blocked_dates column for specific dates that are not available
-- Format: Array of date strings in YYYY-MM-DD format
ALTER TABLE salons ADD COLUMN IF NOT EXISTS blocked_dates TEXT[] DEFAULT '{}';
