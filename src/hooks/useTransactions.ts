import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TransactionType } from '../types/database'

export type CreateTransactionInput = {
  type: TransactionType
  date: string // YYYY-MM-DD
  amount: number
  description: string
  categoryId: string | null
  fromAccountId: string | null
  toAccountId: string | null
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const userId = user!.id
      const month = `${input.date.slice(0, 7)}-01`

      const { data: monthlyBudget } = await supabase
        .from('monthly_budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle()

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        monthly_budget_id: monthlyBudget?.id ?? null,
        date: input.date,
        amount: input.amount,
        type: input.type,
        category_id: input.categoryId,
        from_account_id: input.fromAccountId,
        to_account_id: input.toAccountId,
        description: input.description || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
    },
  })
}
