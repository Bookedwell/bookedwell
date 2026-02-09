-- PRODUCTION-READY FIX
-- Pattern: RLS ON + service role for server ops + proper policies for client

-- 1. Remove auth trigger (we handle salon creation in API)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_salon_id();

-- 2. Clean data
DELETE FROM notification_logs;
DELETE FROM bookings;
DELETE FROM availability_slots;
DELETE FROM customers;
DELETE FROM services;
DELETE FROM staff;
DELETE FROM salons;

-- 3. Unique constraint: 1 user = 1 staff record
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_id_unique;
ALTER TABLE staff ADD CONSTRAINT staff_user_id_unique UNIQUE (user_id);

-- 4. Enable RLS on all tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies (clean slate)
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 6. Simple RLS policies (user can only see own salon's data)
-- Staff: users can see their own record
CREATE POLICY "staff_select_own" ON staff FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "staff_insert_own" ON staff FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff_update_own" ON staff FOR UPDATE USING (user_id = auth.uid());

-- Salons: users can see/edit salons they work at
CREATE POLICY "salons_select" ON salons FOR SELECT USING (
  id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "salons_update" ON salons FOR UPDATE USING (
  id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "salons_insert" ON salons FOR INSERT WITH CHECK (true);

-- Services: linked to salon
CREATE POLICY "services_select" ON services FOR SELECT USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "services_all" ON services FOR ALL USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);

-- Bookings: linked to salon
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "bookings_all" ON bookings FOR ALL USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);

-- Customers: linked to salon
CREATE POLICY "customers_select" ON customers FOR SELECT USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "customers_all" ON customers FOR ALL USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);

-- Availability: linked to salon
CREATE POLICY "availability_select" ON availability_slots FOR SELECT USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "availability_all" ON availability_slots FOR ALL USING (
  salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid())
);

-- Notification logs: via bookings
CREATE POLICY "notifications_select" ON notification_logs FOR SELECT USING (
  booking_id IN (
    SELECT id FROM bookings WHERE salon_id IN (
      SELECT salon_id FROM staff WHERE user_id = auth.uid()
    )
  )
);

-- Public booking page: anyone can view salon, services (by slug)
CREATE POLICY "public_salons_view" ON salons FOR SELECT USING (active = true);
CREATE POLICY "public_services_view" ON services FOR SELECT USING (available = true);
