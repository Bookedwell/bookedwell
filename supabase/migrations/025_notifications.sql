-- Notifications table for salon dashboard
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Notification type
  type TEXT NOT NULL, -- 'new_booking', 'booking_changed', 'booking_cancelled', 'no_show'
  
  -- Related entities
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_name TEXT,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notifications_salon ON notifications(salon_id);
CREATE INDEX idx_notifications_read ON notifications(salon_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own salon notifications"
  ON notifications FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update own salon notifications"
  ON notifications FOR UPDATE
  USING (
    salon_id IN (
      SELECT salon_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all notifications"
  ON notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
