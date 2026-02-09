-- Fix: handle_new_user trigger must support phone-only users
-- Phone users don't have an email, so we need COALESCE for email fields

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_salon_id UUID;
  user_name TEXT;
  user_slug TEXT;
  user_email TEXT;
  user_phone TEXT;
BEGIN
  -- Extract name from metadata, email, or phone
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE NULL END,
    COALESCE(NEW.phone, 'Gebruiker')
  );
  
  -- Get email (may be null for phone users)
  user_email := COALESCE(NEW.email, '');
  
  -- Get phone (may be null for email users)
  user_phone := COALESCE(NEW.phone, '');

  -- Generate a unique slug
  IF NEW.email IS NOT NULL THEN
    user_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  ELSE
    user_slug := lower('salon-' || substr(md5(random()::text), 1, 8));
  END IF;
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM salons WHERE slug = user_slug) LOOP
    user_slug := user_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Create salon (email and phone allow empty string)
  INSERT INTO salons (slug, name, email, phone)
  VALUES (
    user_slug,
    user_name || '''s Salon',
    user_email,
    user_phone
  )
  RETURNING id INTO new_salon_id;
  
  -- Create staff record as owner
  INSERT INTO staff (salon_id, user_id, name, email, phone, role)
  VALUES (
    new_salon_id,
    NEW.id,
    user_name,
    NULLIF(user_email, ''),
    NULLIF(user_phone, ''),
    'owner'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
