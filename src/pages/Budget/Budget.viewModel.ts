import { useEffect, useState } from 'react'
import {
  useAccountBalances,
  useBudgetDetails,
  useCreateMonthlyBudget,
  useDeleteMonthlyBudget,
  useMonthlyBudgets,
} from '../../hooks/useMonthlyBudgets'
import { formatMonthLabel, nextMonthKey, toMonthKey } from '../../lib/month'

export function useBudgetViewModel() {
  const { data: budgets, isLoading } = useMonthlyBudgets()
  const createBudget = useCreateMonthlyBudget()
  const deleteBudget = useDeleteMonthlyBudget()
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedMonthId && budgets && budgets.length > 0) {
      setSelectedMonthId(budgets[0].id)
    }
  }, [budgets, selectedMonthId])

  const selectedBudget = budgets?.find((b) => b.id === selectedMonthId) ?? null
  const { data: details, isLoading: detailsLoading } = useBudgetDetails(
    selectedBudget?.id ?? null,
  )
  const { data: accountBalances, isLoading: balancesLoading } = useAccountBalances(
    selectedBudget?.id ?? null,
  )

  function handleCreateMonth() {
    setError(null)
    const monthKey =
      budgets && budgets.length > 0
        ? nextMonthKey(budgets[0].month.slice(0, 7))
        : toMonthKey(new Date())

    createBudget.mutate(monthKey, {
      onSuccess: (newBudget) => setSelectedMonthId(newBudget.id),
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create month'),
    })
  }

  function handleDeleteMonth() {
    if (!selectedBudget) return
    const label = formatMonthLabel(selectedBudget.month.slice(0, 7))
    if (!window.confirm(`Delete ${label}? This month's entire budget will be lost.`)) return

    deleteBudget.mutate(selectedBudget.id, {
      onSuccess: () => setSelectedMonthId(null),
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to delete month'),
    })
  }

  return {
    budgets: budgets ?? [],
    isLoading,
    selectedMonthId,
    setSelectedMonthId,
    selectedBudget,
    details: details ?? [],
    detailsLoading,
    accountBalances: accountBalances ?? [],
    balancesLoading,
    error,
    isCreatingBudget: createBudget.isPending,
    isDeletingBudget: deleteBudget.isPending,
    handleCreateMonth,
    handleDeleteMonth,
  }
}
