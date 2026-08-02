-- Lets a settled debt on the /debts page be corrected: reopen it (with or
-- without still expecting repayment) or delete it outright. Additive only —
-- adds two functions, no schema/data changes.

-- Reverts "Mark as paid": removes the linked repayment income transaction
-- (the cash inflow it recorded is undone) and reopens the debt, landing it
-- back in "Unpaid" (p_expect_repayment = true) or "No return"
-- (p_expect_repayment = false).
create or replace function unsettle_debt(
  p_transaction_id uuid,
  p_expect_repayment boolean
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_txn transactions%rowtype;
begin
  select * into v_txn from transactions
    where id = p_transaction_id
      and user_id = auth.uid()
      and type = 'expense'
      and is_settled = true;
  if not found then
    raise exception 'Debt not found or not settled';
  end if;

  if v_txn.settled_transaction_id is not null then
    delete from transactions
      where id = v_txn.settled_transaction_id and user_id = auth.uid();
  end if;

  update transactions
  set is_settled = false, settled_transaction_id = null, expect_repayment = p_expect_repayment
  where id = p_transaction_id;
end;
$$;

-- Deletes a debt outright. If it was already settled, also deletes its
-- linked repayment transaction so no orphaned income is left behind.
create or replace function delete_debt(
  p_transaction_id uuid
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_txn transactions%rowtype;
begin
  select * into v_txn from transactions
    where id = p_transaction_id and user_id = auth.uid();
  if not found then
    raise exception 'Transaction not found';
  end if;

  if v_txn.settled_transaction_id is not null then
    delete from transactions
      where id = v_txn.settled_transaction_id and user_id = auth.uid();
  end if;

  delete from transactions where id = p_transaction_id and user_id = auth.uid();
end;
$$;
