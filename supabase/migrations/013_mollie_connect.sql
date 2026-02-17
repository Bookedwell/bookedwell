-- Add Mollie Connect fields to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_profile_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_access_token TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_refresh_token TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_token_expires_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS mollie_oauth_state TEXT;

-- Add index for OAuth state lookup
CREATE INDEX IF NOT EXISTS idx_salons_mollie_oauth_state ON salons(mollie_oauth_state) WHERE mollie_oauth_state IS NOT NULL;

COMMENT ON COLUMN salons.mollie_profile_id IS 'Mollie profile ID for this salon';
COMMENT ON COLUMN salons.mollie_access_token IS 'Mollie OAuth access token (encrypted in production)';
COMMENT ON COLUMN salons.mollie_refresh_token IS 'Mollie OAuth refresh token (encrypted in production)';
COMMENT ON COLUMN salons.mollie_token_expires_at IS 'When the Mollie access token expires';
COMMENT ON COLUMN salons.mollie_onboarded IS 'Whether Mollie Connect is fully set up';
COMMENT ON COLUMN salons.mollie_oauth_state IS 'Temporary state for OAuth flow verification';
