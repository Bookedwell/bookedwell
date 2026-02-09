// ===== Database types =====

export interface Salon {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  language: string;
  logo_url: string | null;
  primary_color: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  description: string | null;
  booking_buffer_minutes: number;
  min_booking_notice_hours: number;
  max_booking_days_ahead: number;
  require_deposit: boolean;
  deposit_amount_cents: number | null;
  deposit_percentage: number | null;
  require_card_validation: boolean;
  allow_cancellation: boolean;
  cancellation_hours_before: number;
  cancellation_fee_cents: number | null;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  plan: 'free' | 'starter' | 'pro';
  plan_expires_at: string | null;
  active: boolean;
}

export interface Staff {
  id: string;
  created_at: string;
  updated_at: string;
  salon_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'staff';
  working_hours: WorkingHours | null;
  accepts_bookings: boolean;
  active: boolean;
  total_bookings: number;
  no_show_count: number;
  cancellation_count: number;
}

export interface Service {
  id: string;
  created_at: string;
  updated_at: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  deposit_required: boolean;
  deposit_amount_cents: number | null;
  available: boolean;
  display_order: number;
  image_url: string | null;
  category: string | null;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  salon_id: string;
  service_id: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes: string | null;
  status: BookingStatus;
  reminder_confirmation_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  last_reminder_at: string | null;
  confirmed_at: string | null;
  confirmed_via: 'whatsapp' | 'sms' | 'email' | 'manual' | null;
  deposit_paid: boolean;
  deposit_amount_cents: number | null;
  stripe_payment_intent_id: string | null;
  card_validated: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: 'customer' | 'salon' | 'system' | null;
  marked_no_show_at: string | null;
  rescheduled_from: string | null;
  rescheduled_to: string | null;
  reschedule_count: number;
  internal_notes: string | null;
}

export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  salon_id: string;
  name: string;
  email: string | null;
  phone: string;
  total_bookings: number;
  completed_bookings: number;
  no_show_count: number;
  cancellation_count: number;
  last_minute_cancellations: number;
  reliability_score: 'green' | 'yellow' | 'red';
  first_booking_at: string | null;
  last_booking_at: string | null;
  marketing_consent: boolean;
  notes: string | null;
}

export interface AvailabilitySlot {
  id: string;
  created_at: string;
  salon_id: string;
  staff_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  specific_date: string | null;
  is_available: boolean;
}

export interface NotificationLog {
  id: string;
  created_at: string;
  booking_id: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation' | 'rescheduled';
  channel: 'whatsapp' | 'sms' | 'email';
  recipient_phone: string | null;
  recipient_email: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  twilio_sid: string | null;
  resend_id: string | null;
  error_message: string | null;
  retry_count: number;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

// ===== Helper types =====

export interface WorkingHours {
  monday?: TimeRange[];
  tuesday?: TimeRange[];
  wednesday?: TimeRange[];
  thursday?: TimeRange[];
  friday?: TimeRange[];
  saturday?: TimeRange[];
  sunday?: TimeRange[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ===== API types =====

export interface CreateBookingRequest {
  salonId: string;
  serviceId: string;
  staffId?: string;
  startTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
}

export interface CreateBookingResponse {
  bookingId: string;
  status: 'pending' | 'confirmed';
  requiresDeposit: boolean;
  depositAmount?: number;
  stripeClientSecret?: string;
}

export interface AvailabilityRequest {
  salonId: string;
  serviceId: string;
  staffId?: string;
  date: string;
}

export interface AvailabilityResponse {
  slots: TimeSlot[];
}
