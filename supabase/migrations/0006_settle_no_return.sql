-- Lets a "No return" debt be settled directly too (previously settle_debt
-- required expect_repayment = true, so a no-return item had to be flipped
-- back to Unpaid first before it could be marked as paid). Additive only —
-- redefines the function, no schema/data changes.
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
      and is_settled = false;
  if not found then
    raise exception 'Debt not found or already settled';
  end if;

  insert into transactions (
    user_id, monthly_budget_id, date, amount, type, category_id, to_account_id, description
  ) values (
    v_txn.user_id, v_txn.monthly_budget_id, p_date, v_txn.amount, 'income', v_txn.category_id, p_account_id,
    'Repayment from ' || coalesce(v_txn.counterparty_name, 'unknown')
  )
  returning id into v_new_id;

  -- Settling always implies repayment was expected and received, regardless
  -- of what expect_repayment was set to before.
  update transactions
  set is_settled = true, settled_transaction_id = v_new_id, expect_repayment = true
  where id = p_transaction_id;

  return v_new_id;
end;
$$;
