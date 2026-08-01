-- Caishen initial schema: profiles, accounts, categories, monthly_budgets,
-- budget_details, transactions + RLS for multi-user isolation.

create extension if not exists pgcrypto;

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- auto-create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── accounts ────────────────────────────────────────────────────────────
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'cash')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;

create policy "accounts_all_own" on accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── categories ──────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  icon text,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories_all_own" on categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── monthly_budgets ─────────────────────────────────────────────────────
create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null, -- always the 1st of the month
  start_balance numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table monthly_budgets enable row level security;

create policy "monthly_budgets_all_own" on monthly_budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── budget_details ──────────────────────────────────────────────────────
create table if not exists budget_details (
  id uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid not null references monthly_budgets (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  budget_amount numeric not null default 0,
  unique (monthly_budget_id, category_id)
);

alter table budget_details enable row level security;

create policy "budget_details_all_own" on budget_details
  for all using (
    exists (
      select 1 from monthly_budgets mb
      where mb.id = budget_details.monthly_budget_id
        and mb.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from monthly_budgets mb
      where mb.id = budget_details.monthly_budget_id
        and mb.user_id = auth.uid()
    )
  );

-- ── transactions ────────────────────────────────────────────────────────
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  monthly_budget_id uuid references monthly_budgets (id) on delete set null,
  date date not null,
  amount numeric not null,
  type text not null check (type in ('expense', 'income', 'transfer')),
  category_id uuid references categories (id) on delete set null,
  from_account_id uuid references accounts (id) on delete set null,
  to_account_id uuid references accounts (id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "transactions_all_own" on transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
