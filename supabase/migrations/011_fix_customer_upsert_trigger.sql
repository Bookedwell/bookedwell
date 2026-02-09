-- Fix: customer trigger crashes on duplicate phone. Use ON CONFLICT DO UPDATE instead.
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
      last_booking_at = NOW(),
      name = COALESCE(NEW.customer_name, name),
      email = COALESCE(NULLIF(NEW.customer_email, ''), email)
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
    -- Create new customer with ON CONFLICT safety
    INSERT INTO customers (salon_id, name, email, phone, total_bookings, first_booking_at, last_booking_at)
    VALUES (NEW.salon_id, NEW.customer_name, NULLIF(NEW.customer_email, ''), NEW.customer_phone, 1, NOW(), NOW())
    ON CONFLICT ON CONSTRAINT unique_salon_customer_phone
    DO UPDATE SET
      total_bookings = customers.total_bookings + 1,
      last_booking_at = NOW(),
      name = COALESCE(EXCLUDED.name, customers.name),
      email = COALESCE(EXCLUDED.email, customers.email);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
