import type {
  BudgetAccountBalanceWithAccount,
  BudgetDetailWithCategory,
} from '../../types/database'

export type BudgetDetailRowProps = {
  detail: BudgetDetailWithCategory
  monthlyBudgetId: string
}

export type AccountBalanceRowProps = {
  balance: BudgetAccountBalanceWithAccount
  monthlyBudgetId: string
}

export type AddCategoryToBudgetProps = {
  monthlyBudgetId: string
  excludeCategoryIds: string[]
}
