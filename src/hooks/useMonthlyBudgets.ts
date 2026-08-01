import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { monthKeyToDate } from '../lib/month'
import type {
  BudgetAccountBalanceWithAccount,
  BudgetDetailWithCategory,
  MonthlyBudget,
} from '../types/database'

const BUDGETS_KEY = ['monthly_budgets']
const detailsKey = (monthlyBudgetId: string) => ['budget_details', monthlyBudgetId]
const accountBalancesKey = (monthlyBudgetId: string) => [
  'budget_account_balances',
  monthlyBudgetId,
]

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
 * Per-account start balances for a monthly budget. Any active account
 * missing a row (e.g. created after the month started) is auto-seeded at 0
 * so the list always reflects every current funding source.
 */
export function useAccountBalances(monthlyBudgetId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: monthlyBudgetId
      ? accountBalancesKey(monthlyBudgetId)
      : ['budget_account_balances', 'none'],
    queryFn: async () => {
      const { data: activeAccounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
      if (accountsError) throw accountsError

      const { data: existing, error: existingError } = await supabase
        .from('budget_account_balances')
        .select('account_id')
        .eq('monthly_budget_id', monthlyBudgetId!)
      if (existingError) throw existingError

      const existingIds = new Set((existing ?? []).map((b) => b.account_id))
      const missing = (activeAccounts ?? []).filter((a) => !existingIds.has(a.id))

      if (missing.length > 0) {
        const { error: seedError } = await supabase.from('budget_account_balances').insert(
          missing.map((a) => ({
            monthly_budget_id: monthlyBudgetId!,
            account_id: a.id,
            start_balance: 0,
          })),
        )
        if (seedError) throw seedError
      }

      const { data, error } = await supabase
        .from('budget_account_balances')
        .select('*, account:accounts(id, name, type)')
        .eq('monthly_budget_id', monthlyBudgetId!)
      if (error) throw error

      return (data as unknown as BudgetAccountBalanceWithAccount[]).sort((a, b) =>
        a.account.name.localeCompare(b.account.name),
      )
    },
    enabled: !!monthlyBudgetId,
  })
}

async function computeAccountLeftovers(userId: string, previousBudgetId: string) {
  const [{ data: activeAccounts, error: accountsError }, { data: balances, error: balancesError }, { data: txns, error: txnsError }] =
    await Promise.all([
      supabase.from('accounts').select('id').eq('user_id', userId).eq('is_active', true),
      supabase
        .from('budget_account_balances')
        .select('account_id, start_balance')
        .eq('monthly_budget_id', previousBudgetId),
      supabase
        .from('transactions')
        .select('amount, type, from_account_id, to_account_id')
        .eq('monthly_budget_id', previousBudgetId),
    ])
  if (accountsError) throw accountsError
  if (balancesError) throw balancesError
  if (txnsError) throw txnsError

  const previousBalance = new Map(
    (balances ?? []).map((b) => [b.account_id, Number(b.start_balance)]),
  )

  return (activeAccounts ?? []).map((account) => {
    const inflow = (txns ?? [])
      .filter(
        (t) =>
          (t.type === 'income' && t.to_account_id === account.id) ||
          (t.type === 'transfer' && t.to_account_id === account.id),
      )
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const outflow = (txns ?? [])
      .filter(
        (t) =>
          (t.type === 'expense' && t.from_account_id === account.id) ||
          (t.type === 'transfer' && t.from_account_id === account.id),
      )
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const startBalance = (previousBalance.get(account.id) ?? 0) + inflow - outflow
    return { accountId: account.id, startBalance }
  })
}

/**
 * Creates a new monthly budget cycle:
 * - clones budget_details (category + budget_amount) from the most recent
 *   prior month, or seeds one row per expense category if this is the first
 *   month ever
 * - seeds a per-account start balance for every active account, carried
 *   forward as that account's left-over (start_balance + income/transfers-in
 *   - expense/transfers-out) from the previous month
 * - monthly_budgets.start_balance is kept as the sum of those per-account
 *   balances
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

      let previousDetails: { category_id: string; budget_amount: number }[] = []
      let accountLeftovers: { accountId: string; startBalance: number }[] = []

      if (previous) {
        const [{ data: details, error: detailsError }, leftovers] = await Promise.all([
          supabase
            .from('budget_details')
            .select('category_id, budget_amount')
            .eq('monthly_budget_id', previous.id),
          computeAccountLeftovers(userId, previous.id),
        ])
        if (detailsError) throw detailsError

        previousDetails = details ?? []
        accountLeftovers = leftovers
      } else {
        const { data: activeAccounts, error: accountsError } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
        if (accountsError) throw accountsError

        accountLeftovers = (activeAccounts ?? []).map((a) => ({
          accountId: a.id,
          startBalance: 0,
        }))
      }

      const totalStartBalance = accountLeftovers.reduce((sum, a) => sum + a.startBalance, 0)

      const { data: newBudget, error: insertError } = await supabase
        .from('monthly_budgets')
        .insert({ user_id: userId, month, start_balance: totalStartBalance })
        .select()
        .single()
      if (insertError) throw insertError

      if (accountLeftovers.length > 0) {
        const { error: balancesError } = await supabase.from('budget_account_balances').insert(
          accountLeftovers.map((a) => ({
            monthly_budget_id: newBudget.id,
            account_id: a.accountId,
            start_balance: a.startBalance,
          })),
        )
        if (balancesError) throw balancesError
      }

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

/** Updates one account's start balance, then re-syncs the month's total. */
export function useUpdateAccountBalance(monthlyBudgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { accountId: string; startBalance: number }) => {
      const { error: upsertError } = await supabase.from('budget_account_balances').upsert(
        {
          monthly_budget_id: monthlyBudgetId,
          account_id: input.accountId,
          start_balance: input.startBalance,
        },
        { onConflict: 'monthly_budget_id,account_id' },
      )
      if (upsertError) throw upsertError

      const { data: balances, error: balancesError } = await supabase
        .from('budget_account_balances')
        .select('start_balance')
        .eq('monthly_budget_id', monthlyBudgetId)
      if (balancesError) throw balancesError

      const total = (balances ?? []).reduce((sum, b) => sum + Number(b.start_balance), 0)

      const { error: totalError } = await supabase
        .from('monthly_budgets')
        .update({ start_balance: total })
        .eq('id', monthlyBudgetId)
      if (totalError) throw totalError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountBalancesKey(monthlyBudgetId) })
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
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
