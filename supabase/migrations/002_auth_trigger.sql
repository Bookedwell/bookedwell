-- ============================================
-- BookedWell - Auth Trigger
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- When a new user signs up via Supabase Auth,
-- automatically create a salon + staff (owner) record.
-- The user then completes onboarding to fill in salon details.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_salon_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate a unique slug from email prefix
  user_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  
  -- Ensure slug is unique by appending random chars if needed
  WHILE EXISTS (SELECT 1 FROM salons WHERE slug = user_slug) LOOP
    user_slug := user_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Create salon
  INSERT INTO salons (slug, name, email, phone)
  VALUES (
    user_slug,
    user_name || '''s Salon',
    NEW.email,
    ''
  )
  RETURNING id INTO new_salon_id;
  
  -- Create staff record as owner
  INSERT INTO staff (salon_id, user_id, name, email, role)
  VALUES (
    new_salon_id,
    NEW.id,
    user_name,
    NEW.email,
    'owner'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
