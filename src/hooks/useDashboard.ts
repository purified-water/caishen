import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TransactionType } from '../types/database'

export type MonthTransaction = {
  amount: number
  type: TransactionType
  category_id: string | null
  from_account_id: string | null
  to_account_id: string | null
  expect_repayment: boolean
}

/** All transactions for one budget month, unpaginated, for KPI/chart aggregation. */
export function useMonthTransactions(monthlyBudgetId: string | null) {
  return useQuery({
    queryKey: ['month_transactions', monthlyBudgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(
          'amount, type, category_id, from_account_id, to_account_id, expect_repayment',
        )
        .eq('monthly_budget_id', monthlyBudgetId!)
      if (error) throw error
      return data as MonthTransaction[]
    },
    enabled: !!monthlyBudgetId,
  })
}
