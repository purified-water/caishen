import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TransactionType, TransactionWithRelations } from '../types/database'

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
      // Mark stale without refetching to avoid an extra read on every quick-log
      // add; the header refresh button lets the user pull fresh data on demand.
      queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'], refetchType: 'none' })
    },
  })
}

const PAGE_SIZE = 30

export type TransactionFilters = {
  monthlyBudgetId?: string
  categoryId?: string
  accountId?: string
  search?: string
}

export function useTransactionsList(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('transactions')
        .select(
          '*, category:categories(id, name), from_account:accounts!from_account_id(id, name), to_account:accounts!to_account_id(id, name)',
        )
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1)

      if (filters.monthlyBudgetId) {
        query = query.eq('monthly_budget_id', filters.monthlyBudgetId)
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.accountId) {
        query = query.or(
          `from_account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`,
        )
      }
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as unknown as TransactionWithRelations[]
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  })
}

export type UpdateTransactionInput = {
  id: string
  date: string
  amount: number
  description: string
  categoryId: string | null
  fromAccountId: string | null
  toAccountId: string | null
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: input.date,
          amount: input.amount,
          description: input.description || null,
          category_id: input.categoryId,
          from_account_id: input.fromAccountId,
          to_account_id: input.toAccountId,
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}
