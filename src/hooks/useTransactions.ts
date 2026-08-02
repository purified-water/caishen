import {
  useInfiniteQuery,
  useMutation,
  useQuery,
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
  counterpartyName?: string | null
  expectRepayment?: boolean
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
        counterparty_name: input.counterpartyName || null,
        expect_repayment: input.expectRepayment ?? true,
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
          '*, category:categories(id, name, is_debt_related), from_account:accounts!from_account_id(id, name), to_account:accounts!to_account_id(id, name)',
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

/** All expense transactions tagged under a debt-related category (e.g.
 * "Paid For"), across all months, for the /debts page. */
export function useDebtTransactions(categoryIds: string[]) {
  return useQuery({
    queryKey: ['transactions', 'debts', categoryIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(
          '*, category:categories(id, name, is_debt_related), from_account:accounts!from_account_id(id, name), to_account:accounts!to_account_id(id, name)',
        )
        .eq('type', 'expense')
        .in('category_id', categoryIds)
        .order('date', { ascending: false })
      if (error) throw error
      return data as unknown as TransactionWithRelations[]
    },
    enabled: categoryIds.length > 0,
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
  counterpartyName?: string | null
  expectRepayment?: boolean
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
          counterparty_name: input.counterpartyName || null,
          expect_repayment: input.expectRepayment ?? true,
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

export type SettleDebtInput = {
  transactionId: string
  accountId: string
  date: string // YYYY-MM-DD
}

/** Marks a "paid for" expense as repaid: creates the linked income transaction
 * and closes the debt atomically in a single RPC call. */
export function useSettleDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SettleDebtInput) => {
      const { error } = await supabase.rpc('settle_debt', {
        p_transaction_id: input.transactionId,
        p_account_id: input.accountId,
        p_date: input.date,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}

export type SetExpectRepaymentInput = {
  transactionId: string
  expectRepayment: boolean
}

/** Flips "expect repayment" on a not-yet-settled debt — `false` ("no return")
 * stops it showing as outstanding and counts it as a real expense on the
 * dashboard; `true` puts it back on the "Unpaid" list. Plain field update,
 * no linked transaction to worry about since nothing has been settled yet. */
export function useSetExpectRepayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SetExpectRepaymentInput) => {
      const { error } = await supabase
        .from('transactions')
        .update({ expect_repayment: input.expectRepayment })
        .eq('id', input.transactionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}

export type UnsettleDebtInput = {
  transactionId: string
  expectRepayment: boolean
}

/** Reverts a "Mark as paid": deletes the linked repayment transaction and
 * reopens the debt as Unpaid or No return, atomically in a single RPC call. */
export function useUnsettleDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UnsettleDebtInput) => {
      const { error } = await supabase.rpc('unsettle_debt', {
        p_transaction_id: input.transactionId,
        p_expect_repayment: input.expectRepayment,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}

/** Deletes a debt; if it was settled, also deletes its linked repayment
 * transaction so no orphaned income is left behind. */
export function useDeleteDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase.rpc('delete_debt', {
        p_transaction_id: transactionId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] })
      queryClient.invalidateQueries({ queryKey: ['month_transactions'] })
    },
  })
}
