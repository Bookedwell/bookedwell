-- Add Mollie Connect fields to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_profile_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_access_token TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_refresh_token TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_token_expires_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_oauth_state TEXT;

-- Add Mollie subscription fields to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_customer_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_subscription_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS pending_subscription_tier TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS pending_mollie_payment_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add index for OAuth state lookup
CREATE INDEX IF NOT EXISTS idx_salons_mollie_oauth_state ON salons(mollie_oauth_state) WHERE mollie_oauth_state IS NOT NULL;

-- Add Mollie payment fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mollie_payment_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 15;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN salons.mollie_profile_id IS 'Mollie profile ID for this salon';
COMMENT ON COLUMN salons.mollie_access_token IS 'Mollie OAuth access token (encrypted in production)';
COMMENT ON COLUMN salons.mollie_refresh_token IS 'Mollie OAuth refresh token (encrypted in production)';
COMMENT ON COLUMN salons.mollie_token_expires_at IS 'When the Mollie access token expires';
COMMENT ON COLUMN salons.mollie_onboarded IS 'Whether Mollie Connect is fully set up';
COMMENT ON COLUMN salons.mollie_oauth_state IS 'Temporary state for OAuth flow verification';
COMMENT ON COLUMN salons.mollie_customer_id IS 'Mollie customer ID for subscription billing';
COMMENT ON COLUMN salons.mollie_subscription_id IS 'Active Mollie subscription ID';
COMMENT ON COLUMN bookings.mollie_payment_id IS 'Mollie payment ID for this booking';
COMMENT ON COLUMN bookings.platform_fee IS 'Platform fee in cents (default 15 = €0.15)';
