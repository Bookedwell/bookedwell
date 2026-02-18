-- Add missing columns to customers table
alter table customers add column if not exists mobile_phone text;
alter table customers add column if not exists gender text;
alter table customers add column if not exists date_of_birth date;
alter table customers add column if not exists address text;
alter table customers add column if not exists postal_code text;
alter table customers add column if not exists city text;
alter table customers add column if not exists additional_customer_info text;
alter table customers add column if not exists additional_invoice_info text;
alter table customers add column if not exists appointment_warning text;

-- Customer notes table for colleagues to add notes about customers
create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  salon_id uuid references salons(id) on delete cascade not null,
  staff_id uuid references staff(id) on delete set null,
  note text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index if not exists customer_notes_customer_id_idx on customer_notes(customer_id);
create index if not exists customer_notes_salon_id_idx on customer_notes(salon_id);
create index if not exists customer_notes_staff_id_idx on customer_notes(staff_id);

-- RLS policies
alter table customer_notes enable row level security;

-- Drop policy if exists and recreate
drop policy if exists "Salon staff can manage notes for their customers" on customer_notes;

-- Salon staff can view and manage notes for their customers
create policy "Salon staff can manage notes for their customers"
  on customer_notes
  for all
  using (
    salon_id in (
      select salon_id from staff where user_id = auth.uid()
    )
  );
