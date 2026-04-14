-- Tribune Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type case_status as enum (
  'intake_submitted',
  'under_review',
  'letter_ready',
  'letter_sent',
  'awaiting_landlord',
  'landlord_responded',
  'resolved',
  'closed'
);

create type message_type as enum (
  'tribune_letter',
  'tribune_update',
  'tenant_response',
  'tenant_landlord_reply',
  'system'
);

create type action_type as enum (
  'letter_sent',
  'resolution_reported',
  'payment_received'
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- CASES
-- ============================================

create table cases (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references profiles(id) on delete cascade,
  status case_status not null default 'intake_submitted',

  -- Property info
  property_address text not null,
  unit_number text,

  -- Landlord info
  landlord_name text not null,
  landlord_email text,
  landlord_phone text,
  landlord_address text,

  -- Lease info
  lease_start_date date not null,
  lease_end_date date not null,
  move_out_date date not null,
  forwarding_address text,

  -- Deposit info
  deposit_amount_cents integer not null,
  deposit_returned_cents integer not null default 0,
  amount_withheld_cents integer not null default 0,
  withholding_reason text,
  itemized_deductions_received boolean not null default false,
  situation_description text not null,

  -- Agreement
  contingency_pct integer not null default 25,
  contingency_agreed_at timestamptz,

  -- Tracking
  current_letter_number integer not null default 0,
  statutory_deadline date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cases_tenant_id on cases(tenant_id);
create index idx_cases_status on cases(status);

-- ============================================
-- CASE MESSAGES (the correspondence thread)
-- ============================================

create table case_messages (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  message_type message_type not null,
  title text not null,
  body text not null,
  letter_number integer,
  is_admin_only boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_case_messages_case_id on case_messages(case_id, created_at);

-- ============================================
-- CASE ACTIONS (tenant confirmations)
-- ============================================

create table case_actions (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  action_type action_type not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_case_actions_case_id on case_actions(case_id);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger update_cases_updated_at
  before update on cases
  for each row execute procedure update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table cases enable row level security;
alter table case_messages enable row level security;
alter table case_actions enable row level security;

-- Profiles: users read/update their own, admins read all
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

-- Cases: tenants see own, admins see all
create policy "Tenants can read own cases"
  on cases for select
  using (tenant_id = auth.uid());

create policy "Tenants can insert own cases"
  on cases for insert
  with check (tenant_id = auth.uid());

create policy "Admins can read all cases"
  on cases for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update all cases"
  on cases for update
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

-- Messages: tenants see non-admin-only messages for own cases, admins see all
create policy "Tenants can read own case messages"
  on case_messages for select
  using (
    is_admin_only = false
    and exists (
      select 1 from cases where cases.id = case_messages.case_id and cases.tenant_id = auth.uid()
    )
  );

create policy "Tenants can insert messages for own cases"
  on case_messages for insert
  with check (
    exists (
      select 1 from cases where cases.id = case_messages.case_id and cases.tenant_id = auth.uid()
    )
  );

create policy "Admins can read all messages"
  on case_messages for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can insert all messages"
  on case_messages for insert
  with check (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

-- Actions: tenants can read/insert for own cases, admins can do everything
create policy "Tenants can read own case actions"
  on case_actions for select
  using (
    exists (
      select 1 from cases where cases.id = case_actions.case_id and cases.tenant_id = auth.uid()
    )
  );

create policy "Tenants can insert actions for own cases"
  on case_actions for insert
  with check (
    exists (
      select 1 from cases where cases.id = case_actions.case_id and cases.tenant_id = auth.uid()
    )
  );

create policy "Admins can read all actions"
  on case_actions for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can insert all actions"
  on case_actions for insert
  with check (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );
