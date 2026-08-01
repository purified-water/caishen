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
