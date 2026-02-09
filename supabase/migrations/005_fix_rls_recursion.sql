-- Fix infinite recursion in RLS policies
-- The staff policy was referencing itself, causing infinite loop

-- Drop the problematic policies
DROP POLICY IF EXISTS "Staff can view own salon staff" ON staff;
DROP POLICY IF EXISTS "Users can view own staff record" ON staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;

-- Create a helper function to get user's salon_id without triggering RLS
CREATE OR REPLACE FUNCTION get_user_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM staff WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate staff policies using the helper function
CREATE POLICY "Users can view own staff record"
  ON staff FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view salon colleagues"
  ON staff FOR SELECT
  USING (salon_id = get_user_salon_id());

CREATE POLICY "Owners can manage staff"
  ON staff FOR ALL
  USING (
    salon_id = get_user_salon_id()
    AND EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = auth.uid() 
      AND s.salon_id = staff.salon_id 
      AND s.role IN ('owner', 'admin')
    )
  );

-- Also fix salons policy if it has similar issue
DROP POLICY IF EXISTS "Staff can view own salon" ON salons;
DROP POLICY IF EXISTS "Owners can update own salon" ON salons;

CREATE POLICY "Users can view own salon"
  ON salons FOR SELECT
  USING (id = get_user_salon_id());

CREATE POLICY "Owners can update salon"
  ON salons FOR UPDATE
  USING (id = get_user_salon_id());
