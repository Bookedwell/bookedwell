-- Customer labels table
create table if not exists customer_labels (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references salons(id) on delete cascade not null,
  name text not null,
  color text not null default '#3B82F6',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Customer to labels junction table
create table if not exists customer_label_assignments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  label_id uuid references customer_labels(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(customer_id, label_id)
);

-- Add profile_picture_url to customers table
alter table customers 
add column if not exists profile_picture_url text;

-- Indexes
create index if not exists customer_labels_salon_id_idx on customer_labels(salon_id);
create index if not exists customer_label_assignments_customer_id_idx on customer_label_assignments(customer_id);
create index if not exists customer_label_assignments_label_id_idx on customer_label_assignments(label_id);

-- RLS policies
alter table customer_labels enable row level security;
alter table customer_label_assignments enable row level security;

-- Salon can manage their own labels
create policy "Salons can manage their own labels"
  on customer_labels
  for all
  using (salon_id in (
    select salon_id from staff where user_id = auth.uid()
  ));

-- Salon can manage label assignments for their customers
create policy "Salons can manage label assignments for their customers"
  on customer_label_assignments
  for all
  using (
    customer_id in (
      select c.id from customers c
      inner join staff s on c.salon_id = s.salon_id
      where s.user_id = auth.uid()
    )
  );
