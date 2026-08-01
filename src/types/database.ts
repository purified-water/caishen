export type CategoryType = 'expense' | 'income'
export type AccountType = 'bank' | 'cash'

export type Category = {
  id: string
  user_id: string
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: AccountType
  is_active: boolean
  created_at: string
}

export type TransactionType = 'expense' | 'income' | 'transfer'

export type MonthlyBudget = {
  id: string
  user_id: string
  month: string // YYYY-MM-DD, always the 1st of the month
  start_balance: number
  notes: string | null
  created_at: string
}

export type BudgetDetail = {
  id: string
  monthly_budget_id: string
  category_id: string
  budget_amount: number
}

export type BudgetDetailWithCategory = BudgetDetail & {
  category: Pick<Category, 'id' | 'name' | 'type'>
}

export type Transaction = {
  id: string
  user_id: string
  monthly_budget_id: string | null
  date: string
  amount: number
  type: TransactionType
  category_id: string | null
  from_account_id: string | null
  to_account_id: string | null
  description: string | null
  created_at: string
}

export type TransactionWithRelations = Transaction & {
  category: Pick<Category, 'id' | 'name'> | null
  from_account: Pick<Account, 'id' | 'name'> | null
  to_account: Pick<Account, 'id' | 'name'> | null
}
