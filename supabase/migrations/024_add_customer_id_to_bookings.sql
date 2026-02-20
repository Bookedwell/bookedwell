-- Add customer_id to bookings table for linking bookings to customers
alter table bookings add column if not exists customer_id uuid references customers(id) on delete set null;

-- Create index for faster customer lookups
create index if not exists bookings_customer_id_idx on bookings(customer_id);
