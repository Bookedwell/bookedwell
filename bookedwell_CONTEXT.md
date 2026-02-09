# STIPT - Project Context File

## 🎯 Project Overview

**Stipt** is een no-show prevention + booking platform voor kleine bedrijven die op afspraken draaien (barbers, nails, beauty, massage, detailing, kleine praktijken).

**Kern probleem:** No-shows, gemiste omzet, tijdverspilling aan heen-en-weer appen.

**Oplossing:** Professionele boekingspagina + automatische WhatsApp reminders + optional aanbetaling.

**Value proposition:** "Wij zetten je afspraken online en sturen automatische WhatsApp reminders, zodat je minder no-shows hebt en je agenda voller blijft."

---

## 🏗️ Tech Stack

### Frontend + Backend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **Subdomain Strategy:** `jouwsalon.stipt.app` (wildcard subdomains)

### Database + Auth
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (for salon/service images)
- **Real-time:** Supabase Realtime (optional for live dashboard)

### External Services
- **Messaging:** Twilio (WhatsApp Business API + SMS fallback)
- **Payments:** Stripe (for deposits/card validation)
- **Email:** Resend (for email confirmations)

### Development
- **Package Manager:** pnpm
- **Linting:** ESLint + Prettier
- **Type Safety:** TypeScript strict mode
- **Environment:** .env.local (never commit)

---

## 🎨 Design System

### Brand Colors (from logo)

```typescript
// No gradients - only solid colors
const colors = {
  primary: {
    teal: '#14B8A6',      // Main brand color (from logo circle)
    tealDark: '#0D9488',  // Hover states
    tealLight: '#5EEAD4', // Backgrounds
  },
  accent: {
    blue: '#3B82F6',      // Accent dot (from logo)
    blueLight: '#60A5FA', // Links
  },
  neutral: {
    navy: '#0F172A',      // Text primary (from logo text)
    slate: '#1E293B',     // Text secondary
    gray: '#64748B',      // Text tertiary
    lightGray: '#CBD5E1', // Borders
    bgGray: '#F1F5F9',    // Backgrounds
    white: '#FFFFFF',
  },
  status: {
    success: '#10B981',   // Confirmed bookings
    warning: '#F59E0B',   // Pending confirmations
    error: '#EF4444',     // No-shows / cancelled
    info: '#3B82F6',      // Informational
  },
}
```

### Typography

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}
```

### Spacing & Layout

```typescript
const spacing = {
  containerMaxWidth: '1280px',
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
}
```

### Icons

**Use SVG icons only - NO text emoticons**

Recommended icon libraries:
- Lucide React (preferred - matches design aesthetic)
- Heroicons (alternative)

```typescript
// Example usage
import { Check, Clock, Calendar, User, Mail } from 'lucide-react';

// DO NOT USE: ✅ ❌ 📅 ⏰ (text emoticons)
// USE: <Check className="w-5 h-5 text-teal" />
```

---

## 📊 Database Schema (Supabase)

### Table: salons

```sql
CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identity
  slug TEXT UNIQUE NOT NULL, -- jouwsalon (for subdomain)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Settings
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'nl',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#14B8A6',
  
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
  plan TEXT DEFAULT 'free', -- free, starter, pro
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_salons_slug ON salons(slug);
CREATE INDEX idx_salons_active ON salons(active);
```

### Table: staff

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Role
  role TEXT DEFAULT 'staff', -- owner, admin, staff
  
  -- Scheduling
  working_hours JSONB, -- { "monday": [{"start": "09:00", "end": "17:00"}], ... }
  
  -- Settings
  accepts_bookings BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  
  -- Stats (for tracking)
  total_bookings INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0
);

CREATE INDEX idx_staff_salon ON staff(salon_id);
CREATE INDEX idx_staff_active ON staff(salon_id, active);
```

### Table: services

```sql
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
  
  -- Category (optional)
  category TEXT -- 'knippen', 'kleuren', 'massage', etc.
);

CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_available ON services(salon_id, available);
```

### Table: bookings

```sql
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
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  
  -- Reminders
  reminder_confirmation_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  
  -- Confirmation
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_via TEXT, -- 'whatsapp', 'sms', 'email', 'manual'
  
  -- Payment
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount_cents INTEGER,
  stripe_payment_intent_id TEXT,
  card_validated BOOLEAN DEFAULT false,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by TEXT, -- 'customer', 'salon', 'system'
  
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
```

### Table: customers

```sql
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
  
  -- Score (for no-show prevention)
  reliability_score TEXT DEFAULT 'green', -- green, yellow, red
  
  -- Timestamps
  first_booking_at TIMESTAMP WITH TIME ZONE,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  
  -- Marketing
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  CONSTRAINT unique_customer_phone CHECK (phone IS NOT NULL)
);

CREATE INDEX idx_customers_salon ON customers(salon_id);
CREATE INDEX idx_customers_phone ON customers(salon_id, phone);
CREATE INDEX idx_customers_score ON customers(salon_id, reliability_score);
```

### Table: availability_slots

```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Time slot
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Overrides (for holidays/exceptions)
  specific_date DATE, -- if set, overrides day_of_week
  is_available BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_salon ON availability_slots(salon_id);
CREATE INDEX idx_availability_staff ON availability_slots(staff_id);
```

### Table: notification_logs

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL, -- 'confirmation', 'reminder_24h', 'reminder_2h', 'cancellation', 'rescheduled'
  channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'email'
  
  -- Recipient
  recipient_phone TEXT,
  recipient_email TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, read
  
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
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Salons: users can only access their own salon
CREATE POLICY "Users can view own salon"
  ON salons FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM staff WHERE salon_id = salons.id));

-- Staff: salon owners can manage their staff
CREATE POLICY "Salon can manage staff"
  ON staff FOR ALL
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));

-- Bookings: public can create, salon can manage
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Salon can view/edit bookings"
  ON bookings FOR ALL
  USING (salon_id IN (SELECT salon_id FROM staff WHERE user_id = auth.uid()));
```

---

## 📁 File Structure

```
stipt/
├── app/
│   ├── (public)/              # Public booking pages
│   │   ├── page.tsx           # Main landing page (stipt.app)
│   │   └── salon/
│   │       └── [slug]/
│   │           ├── page.tsx   # Salon booking page
│   │           └── layout.tsx
│   │
│   ├── (dashboard)/           # Salon owner dashboard
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Overview
│   │   │   ├── bookings/
│   │   │   ├── services/
│   │   │   ├── staff/
│   │   │   ├── customers/
│   │   │   ├── settings/
│   │   │   └── analytics/
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   ├── bookings/
│   │   │   ├── create/route.ts
│   │   │   ├── confirm/route.ts
│   │   │   ├── cancel/route.ts
│   │   │   └── reschedule/route.ts
│   │   ├── availability/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── twilio/route.ts
│   │   ├── cron/
│   │   │   ├── send-reminders/route.ts
│   │   │   └── update-scores/route.ts
│   │   └── auth/
│   │
│   ├── middleware.ts          # Subdomain routing + auth
│   └── layout.tsx             # Root layout
│
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── calendar.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   ├── booking/               # Booking flow components
│   │   ├── service-selector.tsx
│   │   ├── time-picker.tsx
│   │   ├── customer-form.tsx
│   │   └── booking-confirmation.tsx
│   ├── dashboard/             # Dashboard components
│   │   ├── booking-list.tsx
│   │   ├── stats-card.tsx
│   │   └── calendar-view.tsx
│   └── shared/
│       ├── header.tsx
│       └── footer.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Client-side Supabase
│   │   ├── server.ts          # Server-side Supabase
│   │   └── types.ts           # Generated types
│   ├── twilio/
│   │   ├── client.ts
│   │   └── templates.ts       # WhatsApp message templates
│   ├── stripe/
│   │   └── client.ts
│   ├── utils/
│   │   ├── date.ts            # Date/time helpers
│   │   ├── availability.ts    # Slot calculation
│   │   └── validation.ts      # Form validation
│   └── constants.ts
│
├── types/
│   └── index.ts               # TypeScript types
│
├── public/
│   ├── logo.svg               # Stipt logo
│   └── icons/
│
├── .env.local                 # Environment variables (DO NOT COMMIT)
├── .env.example               # Template for env vars
├── middleware.ts              # Edge middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # NEVER expose to client

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+31XXXXXXXXX

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@stipt.app

# App
NEXT_PUBLIC_APP_URL=https://stipt.app
CRON_SECRET=random-secret-for-cron-auth

# Optional
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🔄 API Routes

### POST /api/bookings/create

Create a new booking.

**Request:**
```typescript
{
  salonId: string;
  serviceId: string;
  staffId?: string;
  startTime: string; // ISO 8601
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
}
```

**Response:**
```typescript
{
  bookingId: string;
  status: 'pending' | 'confirmed';
  requiresDeposit: boolean;
  depositAmount?: number;
  stripeClientSecret?: string;
}
```

### POST /api/bookings/confirm

Confirm a booking (via WhatsApp link).

**Request:**
```typescript
{
  bookingId: string;
  confirmationToken: string; // JWT to prevent abuse
}
```

### POST /api/bookings/cancel

Cancel a booking.

**Request:**
```typescript
{
  bookingId: string;
  reason?: string;
}
```

### POST /api/bookings/reschedule

Reschedule a booking to a new time.

**Request:**
```typescript
{
  bookingId: string;
  newStartTime: string;
}
```

### GET /api/availability

Get available time slots for a salon/service/staff.

**Query params:**
```
salonId: string
serviceId: string
staffId?: string
date: string (YYYY-MM-DD)
```

**Response:**
```typescript
{
  slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}
```

### POST /api/cron/send-reminders (protected)

Cron job to send reminders.

**Auth:** Bearer token in `Authorization` header.

### POST /api/webhooks/stripe

Handle Stripe webhook events.

### POST /api/webhooks/twilio

Handle Twilio status callbacks.

---

## 🎨 Component Guidelines

### Button Component

```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Button variant="primary" size="lg">
  Boek nu
</Button>

// Styling (Tailwind)
// primary: bg-teal text-white hover:bg-teal-dark
// secondary: bg-blue text-white hover:bg-blue-dark
// outline: border-2 border-teal text-teal hover:bg-teal-light
```

### Calendar Component

```typescript
// components/ui/calendar.tsx
interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

// Should show:
// - Current month view
// - Navigation arrows
// - Highlight selected date
// - Disable past dates and unavailable dates
// - Visual indicator for dates with availability
```

### Time Picker Component

```typescript
// components/booking/time-picker.tsx
interface TimePickerProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
}

// Display as grid of time buttons
// Show "Bezet" for unavailable slots (grayed out)
// Highlight selected slot
```

---

## 📱 WhatsApp Message Templates

### Template 1: Booking Confirmation

```
Hi {{1}}, je afspraak bij {{2}} staat vast!

📅 {{3}} om {{4}}
⏱️ Duur: {{5}} minuten
💶 Prijs: €{{6}}

Bevestig, verzet of annuleer je afspraak:
{{7}}

Tot dan!
```

Variables:
1. Customer name
2. Salon name
3. Date (e.g., "vrijdag 15 maart")
4. Time (e.g., "14:00")
5. Duration
6. Price
7. Action link

### Template 2: 24-hour Reminder

```
Reminder: morgen om {{1}} heb je een afspraak bij {{2}}.

Bevestig dat je komt:
{{3}}

Of verzet je afspraak hier:
{{4}}
```

### Template 3: 2-hour Reminder

```
Over 2 uur! {{1}} verwacht je om {{2}}.

Adres: {{3}}

Tot zo! 👋
```

---

## 🔒 Security Considerations

### Authentication
- Use Supabase Auth for salon owners
- JWT tokens for customer booking confirmations
- Rate limiting on all public endpoints

### Data Privacy
- GDPR compliant (EU-based Supabase)
- Customer data belongs to salon, not Stipt
- Option to delete all data on salon account deletion
- Clear privacy policy

### Payments
- Never store full credit card numbers
- Use Stripe's PCI-compliant infrastructure
- Validate webhooks with signatures

### API Security
- CORS properly configured
- Validate all inputs (Zod schemas)
- Sanitize user-generated content
- Prevent SQL injection (use parameterized queries)

---

## 📊 Analytics & Metrics

### Salon Dashboard KPIs

1. **No-show rate:** `(no_shows / total_bookings) * 100`
2. **Confirmation rate:** `(confirmed / total_bookings) * 100`
3. **Revenue:** Total from completed bookings
4. **Average booking value**
5. **Customer retention:** Repeat bookings percentage
6. **Popular services**
7. **Peak hours/days**

### Customer Reliability Score

```typescript
function calculateReliabilityScore(customer: Customer): 'green' | 'yellow' | 'red' {
  const noShowRate = customer.no_show_count / customer.total_bookings;
  const lastMinuteCancelRate = customer.last_minute_cancellations / customer.total_bookings;
  
  if (noShowRate >= 0.3 || lastMinuteCancelRate >= 0.4) {
    return 'red'; // High risk
  } else if (noShowRate >= 0.15 || lastMinuteCancelRate >= 0.25) {
    return 'yellow'; // Medium risk
  } else {
    return 'green'; // Low risk / reliable
  }
}
```

**Actions based on score:**
- **Red:** Require deposit for all future bookings
- **Yellow:** Send extra reminder
- **Green:** Optional express booking (skip deposit)

---

## 🚀 MVP Feature Checklist

### Phase 1 (Week 1-4)

**Core Booking Flow:**
- [ ] Subdomain routing (`jouwsalon.stipt.app`)
- [ ] Service selection
- [ ] Date/time picker with availability
- [ ] Customer info form
- [ ] Booking confirmation page
- [ ] Email confirmation (Resend)

**Database:**
- [ ] Supabase setup
- [ ] All tables created
- [ ] RLS policies configured
- [ ] Sample data seeded

**Reminders:**
- [ ] Twilio WhatsApp integration
- [ ] Message templates approved
- [ ] Cron job for 24h reminders
- [ ] Cron job for 2h reminders
- [ ] Notification logging

**Payment:**
- [ ] Stripe integration
- [ ] Card validation (€0.01 charge)
- [ ] Webhook handling

**Dashboard (Basic):**
- [ ] Salon owner login (Supabase Auth)
- [ ] View all bookings (list + calendar)
- [ ] Manual booking creation
- [ ] Basic settings (salon info, working hours)

### Phase 2 (Week 5-8)

**Advanced Features:**
- [ ] Multiple staff members
- [ ] Staff scheduling
- [ ] Customer management (view history, add notes)
- [ ] No-show tracking + customer scores
- [ ] Analytics dashboard
- [ ] Cancellation/reschedule flow
- [ ] Waitlist functionality

**Optimization:**
- [ ] Email/SMS fallback if WhatsApp fails
- [ ] Automatic slot filling from waitlist
- [ ] Bulk actions (cancel multiple, export data)
- [ ] Custom branding per salon

### Phase 3 (Future)

- [ ] Mobile app (React Native)
- [ ] Integration with Google Calendar
- [ ] Loyalty program
- [ ] Gift cards
- [ ] Package deals
- [ ] Multi-location support
- [ ] White-label option

---

## 🎯 Code Standards

### TypeScript

```typescript
// Always use explicit types
// ❌ Bad
const booking = data;

// ✅ Good
const booking: Booking = data;

// Use interfaces for objects
interface Booking {
  id: string;
  salonId: string;
  startTime: Date;
  // ...
}

// Use type for unions
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show';
```

### React Components

```typescript
// Use functional components
// Use TypeScript for props
// Extract reusable logic to hooks

interface BookingCardProps {
  booking: Booking;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}

export function BookingCard({ booking, onConfirm, onCancel }: BookingCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      {/* Component content */}
    </div>
  );
}
```

### Naming Conventions

```typescript
// Components: PascalCase
BookingCard, TimeSlotPicker, CustomerForm

// Functions: camelCase
calculateAvailability, sendReminder, formatDate

// Constants: SCREAMING_SNAKE_CASE
MAX_BOOKING_DAYS, DEFAULT_TIMEZONE

// Files: kebab-case
booking-card.tsx, time-slot-picker.tsx

// Database tables: snake_case
salons, booking_slots, notification_logs
```

### Tailwind CSS

```typescript
// Use consistent spacing scale
className="p-4 mt-6 mb-8"

// Group by category
className={`
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 gap-2
  // Colors
  bg-white border border-gray-200
  // Typography
  text-sm font-medium text-navy
  // Effects
  rounded-lg shadow-sm
  // States
  hover:bg-gray-50 active:scale-95
`}
```

---

## 🐛 Error Handling

### Client-side

```typescript
// Use try-catch for async operations
try {
  const response = await fetch('/api/bookings/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Booking failed');
  }
  
  const result = await response.json();
  // Success handling
} catch (error) {
  console.error('Error creating booking:', error);
  toast.error('Er ging iets mis. Probeer het opnieuw.');
}
```

### Server-side (API routes)

```typescript
// app/api/bookings/create/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = bookingSchema.parse(body);
    
    // Business logic
    const booking = await createBooking(validated);
    
    return Response.json({ success: true, booking });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Booking error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 📝 User Messages (Dutch)

### Success Messages
```typescript
const messages = {
  bookingCreated: 'Afspraak gemaakt! Je ontvangt een bevestiging via WhatsApp.',
  bookingConfirmed: 'Afspraak bevestigd. Tot snel!',
  bookingCancelled: 'Afspraak geannuleerd.',
  bookingRescheduled: 'Afspraak verzet naar nieuwe tijd.',
};
```

### Error Messages
```typescript
const errors = {
  slotTaken: 'Deze tijd is inmiddels bezet. Kies een andere tijd.',
  pastDate: 'Je kunt geen afspraak maken in het verleden.',
  tooEarly: 'Je kunt minimaal {{hours}} uur van tevoren boeken.',
  tooFar: 'Je kunt maximaal {{days}} dagen vooruit boeken.',
  phoneInvalid: 'Vul een geldig telefoonnummer in.',
  emailInvalid: 'Vul een geldig e-mailadres in.',
  depositFailed: 'Betaling mislukt. Probeer het opnieuw.',
  generic: 'Er ging iets mis. Probeer het opnieuw of neem contact op.',
};
```

---

## 🎨 UI/UX Principles

### Booking Flow

1. **Minimize steps:** Service → Time → Contact → Done (max 4 steps)
2. **Clear progress:** Show where user is in the flow
3. **Mobile-first:** Most bookings happen on mobile
4. **Speed:** Each step should load in <500ms
5. **Trust signals:** Show salon info, reviews, security badges

### Dashboard

1. **Scannable:** Important info at a glance
2. **Action-oriented:** Buttons for common tasks (add booking, send reminder)
3. **Status indicators:** Use colors consistently (green = good, yellow = warning, red = urgent)
4. **Responsive:** Works on tablet for salon owners

### Accessibility

- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation
- [ ] Screen reader friendly
- [ ] Color contrast ratios (minimum 4.5:1)
- [ ] Focus indicators
- [ ] Alt text for images

---

## 🔄 Deployment Workflow

### Development
```bash
# Local development
pnpm dev

# Access at: http://localhost:3000
# Test subdomain: http://test-salon.localhost:3000
```

### Staging
```bash
# Push to staging branch
git push origin staging

# Auto-deploys to: staging.stipt.app
```

### Production
```bash
# Merge to main
git checkout main
git merge staging
git push origin main

# Auto-deploys to: stipt.app
```

### Environment Setup

**Vercel:**
- Create 2 projects: `stipt-staging` and `stipt-production`
- Configure environment variables in each
- Set custom domains
- Enable cron jobs

**Supabase:**
- Use 2 projects: staging and production
- Run migrations in both
- Backup production database daily

---

## 📞 Support & Monitoring

### Error Tracking
- **Sentry:** Catch and report errors
- **Vercel Analytics:** Performance monitoring

### Logging
```typescript
// Structured logging
import { logger } from '@/lib/logger';

logger.info('Booking created', { bookingId, salonId });
logger.error('Twilio failed', { error, bookingId });
```

### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    twilio: await checkTwilio(),
    stripe: await checkStripe(),
  };
  
  const healthy = Object.values(checks).every(c => c === true);
  
  return Response.json(
    { healthy, checks },
    { status: healthy ? 200 : 503 }
  );
}
```

---

## 🎯 Success Metrics

### For Salons (customers)
- No-show rate reduction (target: 50% reduction)
- Time saved (no more manual reminder messages)
- Revenue increase (fewer empty slots)

### For Stipt (business)
- Number of active salons
- Bookings per month
- Monthly Recurring Revenue (MRR)
- Churn rate
- Net Promoter Score (NPS)

---

## 📚 Additional Resources

### Documentation to create
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Salon owner onboarding guide
- [ ] Customer booking guide
- [ ] FAQ
- [ ] Privacy policy
- [ ] Terms of service

### Marketing assets
- [ ] Demo video
- [ ] Screenshots for website
- [ ] Case studies (when available)
- [ ] Email templates for outreach

---

## 🎬 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys

# Run database migrations
pnpm supabase db push

# Start development server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Build for production
pnpm build

# Deploy to Vercel
vercel --prod
```

---

**END OF CONTEXT FILE**

This file should be placed in your project root and referenced when working with AI assistants or onboarding developers.
