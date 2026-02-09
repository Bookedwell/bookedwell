-- ============================================
-- BookedWell - Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SALONS
-- ============================================
CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identity
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Settings
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'nl',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4285F4',
  
  -- Business info
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'NL',
  description TEXT,
  
  -- Booking settings
  booking_buffer_minutes INTEGER DEFAULT 15,
  min_booking_notice_hours INTEGER DEFAULT 2,
  max_booking_days_ahead INTEGER DEFAULT 60,
  
  -- No-show prevention
  require_deposit BOOLEAN DEFAULT false,
  deposit_amount_cents INTEGER,
  deposit_percentage INTEGER,
  require_card_validation BOOLEAN DEFAULT true,
  
  -- Cancellation policy
  allow_cancellation BOOLEAN DEFAULT true,
  cancellation_hours_before INTEGER DEFAULT 24,
  cancellation_fee_cents INTEGER,
  
  -- Notifications
  whatsapp_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  
  -- Stripe
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT false,
  
  -- Subscription
  plan TEXT DEFAULT 'free', -- free, growth, pro
  platform_fee_percent INTEGER DEFAULT 15,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_salons_slug ON salons(slug);
CREATE INDEX idx_salons_active ON salons(active);

-- ============================================
-- 2. STAFF
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Identity
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Role
  role TEXT DEFAULT 'staff',
  
  -- Scheduling
  working_hours JSONB,
  
  -- Settings
  accepts_bookings BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0
);

CREATE INDEX idx_staff_salon ON staff(salon_id);
CREATE INDEX idx_staff_active ON staff(salon_id, active);
CREATE INDEX idx_staff_user ON staff(user_id);

-- ============================================
-- 3. SERVICES
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Service details
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  
  -- Settings
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount_cents INTEGER,
  
  -- Availability
  available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Images
  image_url TEXT,
  
  -- Category
  category TEXT
);

CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_available ON services(salon_id, available);

-- ============================================
-- 4. BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relations
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  
  -- Appointment time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Reminders
  reminder_confirmation_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  
  -- Confirmation
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_via TEXT,
  
  -- Payment
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount_cents INTEGER,
  stripe_payment_intent_id TEXT,
  card_validated BOOLEAN DEFAULT false,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  
  -- No-show tracking
  marked_no_show_at TIMESTAMP WITH TIME ZONE,
  
  -- Rescheduling
  rescheduled_from UUID REFERENCES bookings(id),
  rescheduled_to UUID REFERENCES bookings(id),
  reschedule_count INTEGER DEFAULT 0,
  
  -- Internal notes
  internal_notes TEXT,
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'))
);

CREATE INDEX idx_bookings_salon_time ON bookings(salon_id, start_time);
CREATE INDEX idx_bookings_staff_time ON bookings(staff_id, start_time);
CREATE INDEX idx_bookings_status ON bookings(salon_id, status);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_reminders ON bookings(salon_id, reminder_24h_sent, start_time);

-- ============================================
-- 5. CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0,
  last_minute_cancellations INTEGER DEFAULT 0,
  
  -- Score
  reliability_score TEXT DEFAULT 'green',
  
  -- Timestamps
  first_booking_at TIMESTAMP WITH TIME ZONE,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  
  -- Marketing
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  CONSTRAINT unique_salon_customer_phone UNIQUE (salon_id, phone)
);

CREATE INDEX idx_customers_salon ON customers(salon_id);
CREATE INDEX idx_customers_phone ON customers(salon_id, phone);
CREATE INDEX idx_customers_score ON customers(salon_id, reliability_score);

-- ============================================
-- 6. AVAILABILITY SLOTS
-- ============================================
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Time slot
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Overrides
  specific_date DATE,
  is_available BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_salon ON availability_slots(salon_id);
CREATE INDEX idx_availability_staff ON availability_slots(staff_id);

-- ============================================
-- 7. NOTIFICATION LOGS
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  
  -- Recipient
  recipient_phone TEXT,
  recipient_email TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- External IDs
  twilio_sid TEXT,
  resend_id TEXT,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_booking ON notification_logs(booking_id);
CREATE INDEX idx_notifications_status ON notification_logs(status, created_at);

-- ============================================
-- 8. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Public: anyone can view active salons by slug (for booking pages)
CREATE POLICY "Public can view active salons"
  ON salons FOR SELECT
  USING (active = true);

-- Salon owners/staff can manage their own salon
CREATE POLICY "Staff can update own salon"
  ON salons FOR UPDATE
  USING (id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Staff: salon members can view, owners/admins can manage
CREATE POLICY "Staff can view own salon staff"
  ON staff FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  USING (salon_id IN (
    SELECT salon_id FROM staff 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Services: public can view available, salon can manage
CREATE POLICY "Public can view available services"
  ON services FOR SELECT
  USING (available = true);

CREATE POLICY "Staff can manage services"
  ON services FOR ALL
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Bookings: public can create, salon can manage
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Salon can view own bookings"
  ON bookings FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Salon can update own bookings"
  ON bookings FOR UPDATE
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Customers: salon can manage
CREATE POLICY "Salon can manage customers"
  ON customers FOR ALL
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Availability: public can view, salon can manage
CREATE POLICY "Public can view availability"
  ON availability_slots FOR SELECT
  USING (is_available = true);

CREATE POLICY "Staff can manage availability"
  ON availability_slots FOR ALL
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Notification logs: salon can view
CREATE POLICY "Salon can view notifications"
  ON notification_logs FOR SELECT
  USING (booking_id IN (
    SELECT id FROM bookings 
    WHERE salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
  ));

-- ============================================
-- 10. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-assets', 'salon-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view salon assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-assets');

CREATE POLICY "Authenticated users can upload salon assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'salon-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'salon-assets' AND auth.role() = 'authenticated');

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to update customer reliability score
CREATE OR REPLACE FUNCTION update_customer_reliability_score()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Find customer by phone + salon
  SELECT * INTO customer_record 
  FROM customers 
  WHERE salon_id = NEW.salon_id AND phone = NEW.customer_phone
  LIMIT 1;
  
  IF customer_record IS NOT NULL THEN
    -- Update stats
    UPDATE customers SET
      total_bookings = total_bookings + 1,
      last_booking_at = NOW()
    WHERE id = customer_record.id;
    
    -- Recalculate score
    UPDATE customers SET
      reliability_score = CASE
        WHEN no_show_count >= 3 OR (total_bookings > 0 AND no_show_count::float / total_bookings > 0.3) THEN 'red'
        WHEN no_show_count >= 1 OR last_minute_cancellations >= 2 THEN 'yellow'
        ELSE 'green'
      END
    WHERE id = customer_record.id;
  ELSE
    -- Create new customer
    INSERT INTO customers (salon_id, name, email, phone, total_bookings, first_booking_at, last_booking_at)
    VALUES (NEW.salon_id, NEW.customer_name, NEW.customer_email, NEW.customer_phone, 1, NOW(), NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_update_customer
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_reliability_score();

-- Function to increment no-show count
CREATE OR REPLACE FUNCTION handle_no_show()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    -- Update customer
    UPDATE customers SET
      no_show_count = no_show_count + 1,
      reliability_score = CASE
        WHEN no_show_count + 1 >= 3 THEN 'red'
        WHEN no_show_count + 1 >= 1 THEN 'yellow'
        ELSE 'green'
      END
    WHERE salon_id = NEW.salon_id AND phone = NEW.customer_phone;
    
    -- Update staff stats
    IF NEW.staff_id IS NOT NULL THEN
      UPDATE staff SET no_show_count = no_show_count + 1 WHERE id = NEW.staff_id;
    END IF;
    
    NEW.marked_no_show_at = NOW();
  END IF;
  
  -- Handle completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE customers SET
      completed_bookings = completed_bookings + 1
    WHERE salon_id = NEW.salon_id AND phone = NEW.customer_phone;
    
    IF NEW.staff_id IS NOT NULL THEN
      UPDATE staff SET total_bookings = total_bookings + 1 WHERE id = NEW.staff_id;
    END IF;
  END IF;
  
  -- Handle cancellation
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE customers SET
      cancellation_count = cancellation_count + 1,
      last_minute_cancellations = CASE
        WHEN NEW.start_time - NOW() < INTERVAL '24 hours' THEN last_minute_cancellations + 1
        ELSE last_minute_cancellations
      END
    WHERE salon_id = NEW.salon_id AND phone = NEW.customer_phone;
    
    IF NEW.staff_id IS NOT NULL THEN
      UPDATE staff SET cancellation_count = cancellation_count + 1 WHERE id = NEW.staff_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_status_change
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_no_show();
