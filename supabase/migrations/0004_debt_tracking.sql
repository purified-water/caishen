-- Debt tracking for "paid for the group" workflow. Additive only — existing
-- rows keep working unchanged via defaults (is_debt_related = false,
-- expect_repayment = true, is_settled = false).

alter table categories
  add column if not exists is_debt_related boolean not null default false;

update categories
set is_debt_related = true
where name in ('Paid For', 'Debt Gather');

alter table transactions
  add column if not exists counterparty_name text,
  add column if not exists is_settled boolean not null default false,
  add column if not exists settled_transaction_id uuid references transactions (id) on delete set null,
  add column if not exists expect_repayment boolean not null default true;

-- Marks a "paid for" expense as repaid: creates the matching income
-- transaction (real cash inflow into the chosen account) and links +
-- closes the original debt row, atomically in one call.
create or replace function settle_debt(
  p_transaction_id uuid,
  p_account_id uuid,
  p_date date
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_txn transactions%rowtype;
  v_new_id uuid;
begin
  select * into v_txn from transactions
    where id = p_transaction_id
      and user_id = auth.uid()
      and type = 'expense'
      and is_settled = false
      and expect_repayment = true;
  if not found then
    raise exception 'Debt not found, already settled, or marked as no-return';
  end if;

  insert into transactions (
    user_id, monthly_budget_id, date, amount, type, category_id, to_account_id, description
  ) values (
    v_txn.user_id, v_txn.monthly_budget_id, p_date, v_txn.amount, 'income', v_txn.category_id, p_account_id,
    'Repayment from ' || coalesce(v_txn.counterparty_name, 'unknown')
  )
  returning id into v_new_id;

  update transactions
  set is_settled = true, settled_transaction_id = v_new_id
  where id = p_transaction_id;

  return v_new_id;
end;
$$;
