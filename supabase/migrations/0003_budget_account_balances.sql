-- Per-account start balance for each monthly budget cycle. The month's
-- overall start_balance (monthly_budgets.start_balance) is kept as the sum
-- of these rows, computed and written whenever a row here changes.

create table if not exists budget_account_balances (
  id uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid not null references monthly_budgets (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  start_balance numeric not null default 0,
  unique (monthly_budget_id, account_id)
);

alter table budget_account_balances enable row level security;

create policy "budget_account_balances_all_own" on budget_account_balances
  for all using (
    exists (
      select 1 from monthly_budgets mb
      where mb.id = budget_account_balances.monthly_budget_id
        and mb.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from monthly_budgets mb
      where mb.id = budget_account_balances.monthly_budget_id
        and mb.user_id = auth.uid()
    )
  );
