-- Seed default categories for every existing auth user.
-- Idempotent: skips categories that already exist for that user (by name + type).
-- Savings & Investing group is stored as type = 'expense' (money leaving the
-- available budget), since the schema only supports expense/income.

insert into public.categories (user_id, name, type)
select u.id, c.name, c.type
from auth.users u
cross join (
  values
    -- Income
    ('Salary', 'income'),
    ('Interest & Return', 'income'),
    ('Debt Gather', 'income'),
    ('Refund', 'income'),
    ('Other Income', 'income'),
    -- Expense
    ('House Rent', 'expense'),
    ('Utilities', 'expense'),
    ('Drinking Water', 'expense'),
    ('Meal', 'expense'),
    ('Groceries', 'expense'),
    ('Snack & Drink', 'expense'),
    ('Fuel', 'expense'),
    ('Transport', 'expense'),
    ('Personal Item', 'expense'),
    ('Personal Service', 'expense'),
    ('Sport & Fitness', 'expense'),
    ('Entertainment', 'expense'),
    ('Education', 'expense'),
    ('Work', 'expense'),
    ('Gift & Donation', 'expense'),
    ('Travel', 'expense'),
    ('Paid For', 'expense'),
    ('Parking', 'expense'),
    ('Other Expenses', 'expense'),
    -- Savings & Investing
    ('Investing', 'expense'),
    ('Saving', 'expense'),
    ('Emergency Fund', 'expense')
) as c(name, type)
where not exists (
  select 1 from public.categories existing
  where existing.user_id = u.id
    and existing.name = c.name
    and existing.type = c.type
);
