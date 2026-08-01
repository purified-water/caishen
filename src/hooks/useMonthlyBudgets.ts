import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { monthKeyToDate } from '../lib/month'
import type {
  BudgetDetailWithCategory,
  MonthlyBudget,
} from '../types/database'

const BUDGETS_KEY = ['monthly_budgets']
const detailsKey = (monthlyBudgetId: string) => ['budget_details', monthlyBudgetId]

export function useMonthlyBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .order('month', { ascending: false })
      if (error) throw error
      return data as MonthlyBudget[]
    },
  })
}

export function useBudgetDetails(monthlyBudgetId: string | null) {
  return useQuery({
    queryKey: monthlyBudgetId ? detailsKey(monthlyBudgetId) : ['budget_details', 'none'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_details')
        .select('*, category:categories(id, name, type)')
        .eq('monthly_budget_id', monthlyBudgetId!)
      if (error) throw error
      return data as unknown as BudgetDetailWithCategory[]
    },
    enabled: !!monthlyBudgetId,
  })
}

/**
 * Creates a new monthly budget cycle:
 * - clones budget_details (category + budget_amount) from the most recent
 *   prior month, or seeds one row per expense category if this is the first
 *   month ever
 * - sets start_balance to the previous month's left-over
 *   (start_balance + income - expense from its transactions), ignoring
 *   transfers since those only move money between the user's own accounts
 */
export function useCreateMonthlyBudget() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (monthKey: string) => {
      const month = monthKeyToDate(monthKey)
      const userId = user!.id

      const { data: existing, error: existingError } = await supabase
        .from('monthly_budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle()
      if (existingError) throw existingError
      if (existing) throw new Error('This month already exists')

      const { data: previous, error: previousError } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId)
        .lt('month', month)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (previousError) throw previousError

      let startBalance = 0
      let previousDetails: { category_id: string; budget_amount: number }[] = []

      if (previous) {
        const [{ data: details, error: detailsError }, { data: txns, error: txnsError }] =
          await Promise.all([
            supabase
              .from('budget_details')
              .select('category_id, budget_amount')
              .eq('monthly_budget_id', previous.id),
            supabase
              .from('transactions')
              .select('amount, type')
              .eq('monthly_budget_id', previous.id),
          ])
        if (detailsError) throw detailsError
        if (txnsError) throw txnsError

        previousDetails = details ?? []
        const income = (txns ?? [])
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const expense = (txns ?? [])
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        startBalance = Number(previous.start_balance) + income - expense
      }

      const { data: newBudget, error: insertError } = await supabase
        .from('monthly_budgets')
        .insert({ user_id: userId, month, start_balance: startBalance })
        .select()
        .single()
      if (insertError) throw insertError

      if (previousDetails.length > 0) {
        const { error: cloneError } = await supabase.from('budget_details').insert(
          previousDetails.map((d) => ({
            monthly_budget_id: newBudget.id,
            category_id: d.category_id,
            budget_amount: d.budget_amount,
          })),
        )
        if (cloneError) throw cloneError
      } else {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'expense')
        if (categoriesError) throw categoriesError

        if (categories && categories.length > 0) {
          const { error: seedError } = await supabase.from('budget_details').insert(
            categories.map((c) => ({
              monthly_budget_id: newBudget.id,
              category_id: c.id,
              budget_amount: 0,
            })),
          )
          if (seedError) throw seedError
        }
      }

      return newBudget as MonthlyBudget
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  })
}

export function useUpdateStartBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; startBalance: number }) => {
      const { error } = await supabase
        .from('monthly_budgets')
        .update({ start_balance: input.startBalance })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  })
}

export function useUpsertBudgetDetail(monthlyBudgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { categoryId: string; budgetAmount: number }) => {
      const { error } = await supabase.from('budget_details').upsert(
        {
          monthly_budget_id: monthlyBudgetId,
          category_id: input.categoryId,
          budget_amount: input.budgetAmount,
        },
        { onConflict: 'monthly_budget_id,category_id' },
      )
      if (error) throw error
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: detailsKey(monthlyBudgetId) }),
  })
}

export function useRemoveBudgetDetail(monthlyBudgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetDetailId: string) => {
      const { error } = await supabase
        .from('budget_details')
        .delete()
        .eq('id', budgetDetailId)
      if (error) throw error
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: detailsKey(monthlyBudgetId) }),
  })
}

export function useDeleteMonthlyBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('monthly_budgets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  })
}
