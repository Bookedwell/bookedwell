-- ============================================
-- Subscription Tiers with Auto-Upgrade
-- ============================================

-- Update salons table with new subscription fields
ALTER TABLE salons 
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS platform_fee_percent,
  DROP COLUMN IF EXISTS plan_expires_at;

ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'booked_100';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS bookings_this_period INTEGER DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_upgrade_enabled BOOLEAN DEFAULT true;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMP WITH TIME ZONE;

-- Constraint for valid tiers
ALTER TABLE salons DROP CONSTRAINT IF EXISTS valid_subscription_tier;
ALTER TABLE salons ADD CONSTRAINT valid_subscription_tier 
  CHECK (subscription_tier IN ('booked_100', 'booked_500', 'booked_unlimited'));

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS idx_salons_subscription ON salons(subscription_tier, subscription_status);

-- ============================================
-- Tier Limits Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_booking_limit INTEGER, -- NULL = unlimited
  monthly_price_cents INTEGER NOT NULL,
  per_booking_fee_cents INTEGER NOT NULL,
  whatsapp_fee_cents INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Insert tier definitions
INSERT INTO subscription_tiers (id, name, monthly_booking_limit, monthly_price_cents, per_booking_fee_cents, whatsapp_fee_cents, display_order)
VALUES 
  ('booked_100', 'Booked 100', 100, 995, 25, 12, 1),
  ('booked_500', 'Booked 500', 500, 2995, 25, 12, 2),
  ('booked_unlimited', 'Booked Unlimited', NULL, 9995, 20, 10, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_booking_limit = EXCLUDED.monthly_booking_limit,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  per_booking_fee_cents = EXCLUDED.per_booking_fee_cents,
  whatsapp_fee_cents = EXCLUDED.whatsapp_fee_cents,
  display_order = EXCLUDED.display_order;

-- ============================================
-- Function: Get next tier
-- ============================================
CREATE OR REPLACE FUNCTION get_next_tier(current_tier TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE current_tier
    WHEN 'booked_100' THEN RETURN 'booked_500';
    WHEN 'booked_500' THEN RETURN 'booked_unlimited';
    ELSE RETURN NULL; -- Already at max tier
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Function: Check and auto-upgrade tier
-- ============================================
CREATE OR REPLACE FUNCTION check_and_upgrade_tier()
RETURNS TRIGGER AS $$
DECLARE
  salon_record RECORD;
  tier_record RECORD;
  next_tier TEXT;
BEGIN
  -- Get salon with current booking count
  SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
  
  -- Skip if auto-upgrade is disabled or already unlimited
  IF NOT salon_record.auto_upgrade_enabled OR salon_record.subscription_tier = 'booked_unlimited' THEN
    RETURN NEW;
  END IF;
  
  -- Get current tier limits
  SELECT * INTO tier_record FROM subscription_tiers WHERE id = salon_record.subscription_tier;
  
  -- Check if limit is exceeded (tier_record.monthly_booking_limit is NULL for unlimited)
  IF tier_record.monthly_booking_limit IS NOT NULL AND 
     salon_record.bookings_this_period >= tier_record.monthly_booking_limit THEN
    
    -- Get next tier
    next_tier := get_next_tier(salon_record.subscription_tier);
    
    IF next_tier IS NOT NULL THEN
      -- Upgrade to next tier
      UPDATE salons SET
        subscription_tier = next_tier,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
      WHERE id = NEW.salon_id;
      
      -- Log the upgrade (could trigger a notification/webhook here)
      RAISE NOTICE 'Salon % auto-upgraded from % to %', NEW.salon_id, salon_record.subscription_tier, next_tier;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Increment booking counter
-- ============================================
CREATE OR REPLACE FUNCTION increment_booking_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE salons SET
    bookings_this_period = bookings_this_period + 1
  WHERE id = NEW.salon_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers on booking creation
-- ============================================
DROP TRIGGER IF EXISTS booking_increment_counter ON bookings;
CREATE TRIGGER booking_increment_counter
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_booking_counter();

DROP TRIGGER IF EXISTS booking_check_tier_upgrade ON bookings;
CREATE TRIGGER booking_check_tier_upgrade
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_and_upgrade_tier();

-- ============================================
-- Function: Reset monthly booking counter
-- Called by a scheduled job (Supabase pg_cron or external)
-- ============================================
CREATE OR REPLACE FUNCTION reset_monthly_booking_counters()
RETURNS void AS $$
BEGIN
  UPDATE salons SET
    bookings_this_period = 0,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month'
  WHERE subscription_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Tier upgrade log for billing purposes
-- ============================================
CREATE TABLE IF NOT EXISTS tier_upgrade_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  booking_count_at_upgrade INTEGER,
  processed BOOLEAN DEFAULT false,
  stripe_invoice_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_tier_upgrades_salon ON tier_upgrade_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_tier_upgrades_unprocessed ON tier_upgrade_logs(processed) WHERE processed = false;

-- ============================================
-- Enhanced upgrade function with logging
-- ============================================
CREATE OR REPLACE FUNCTION check_and_upgrade_tier()
RETURNS TRIGGER AS $$
DECLARE
  salon_record RECORD;
  tier_record RECORD;
  next_tier TEXT;
BEGIN
  -- Get salon with current booking count
  SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
  
  -- Skip if auto-upgrade is disabled or already unlimited
  IF NOT salon_record.auto_upgrade_enabled OR salon_record.subscription_tier = 'booked_unlimited' THEN
    RETURN NEW;
  END IF;
  
  -- Get current tier limits
  SELECT * INTO tier_record FROM subscription_tiers WHERE id = salon_record.subscription_tier;
  
  -- Check if limit is exceeded
  IF tier_record.monthly_booking_limit IS NOT NULL AND 
     salon_record.bookings_this_period >= tier_record.monthly_booking_limit THEN
    
    -- Get next tier
    next_tier := get_next_tier(salon_record.subscription_tier);
    
    IF next_tier IS NOT NULL THEN
      -- Log the upgrade for billing
      INSERT INTO tier_upgrade_logs (salon_id, from_tier, to_tier, booking_count_at_upgrade)
      VALUES (NEW.salon_id, salon_record.subscription_tier, next_tier, salon_record.bookings_this_period);
      
      -- Upgrade to next tier
      UPDATE salons SET
        subscription_tier = next_tier,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
      WHERE id = NEW.salon_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
