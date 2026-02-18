-- Booking labels table for custom labels on bookings
create table if not exists booking_labels (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references salons(id) on delete cascade not null,
  name text not null,
  color text not null default '#3B82F6',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add label_id to bookings table to link a booking to a label
alter table bookings add column if not exists label_id uuid references booking_labels(id) on delete set null;

-- Indexes
create index if not exists booking_labels_salon_id_idx on booking_labels(salon_id);
create index if not exists bookings_label_id_idx on bookings(label_id);

-- RLS policies
alter table booking_labels enable row level security;

-- Drop policy if exists and recreate
drop policy if exists "Salons can manage their own booking labels" on booking_labels;

-- Salon staff can manage their own booking labels
create policy "Salons can manage their own booking labels"
  on booking_labels
  for all
  using (
    salon_id in (
      select salon_id from staff where user_id = auth.uid()
    )
  );
