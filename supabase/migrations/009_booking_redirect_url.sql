-- Add booking_redirect_url to salons for custom post-payment redirect
ALTER TABLE salons ADD COLUMN IF NOT EXISTS booking_redirect_url TEXT DEFAULT NULL;
