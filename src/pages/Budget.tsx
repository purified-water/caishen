import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { MoneyInput } from '../components/MoneyInput'
import { useCategories } from '../hooks/useCategories'
import {
  useBudgetDetails,
  useCreateMonthlyBudget,
  useDeleteMonthlyBudget,
  useMonthlyBudgets,
  useRemoveBudgetDetail,
  useUpdateStartBalance,
  useUpsertBudgetDetail,
} from '../hooks/useMonthlyBudgets'
import { formatMonthLabel, nextMonthKey, toMonthKey } from '../lib/month'
import type { BudgetDetailWithCategory, MonthlyBudget } from '../types/database'

function BudgetDetailRow({
  detail,
  monthlyBudgetId,
}: {
  detail: BudgetDetailWithCategory
  monthlyBudgetId: string
}) {
  const upsertDetail = useUpsertBudgetDetail(monthlyBudgetId)
  const removeDetail = useRemoveBudgetDetail(monthlyBudgetId)
  const [value, setValue] = useState(String(detail.budget_amount))

  useEffect(() => {
    setValue(String(detail.budget_amount))
  }, [detail.budget_amount])

  function handleBlur() {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed === detail.budget_amount) return
    upsertDetail.mutate({ categoryId: detail.category.id, budgetAmount: parsed })
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="max-w-40 truncate px-4 py-2 text-sm text-slate-800">
        {detail.category.name}
      </td>
      <td className="px-4 py-2 text-right">
        <MoneyInput
          value={value}
          onChange={setValue}
          onBlur={handleBlur}
          className="w-28 rounded border border-slate-300 px-2 py-1 text-right text-sm"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <button
          onClick={() => removeDetail.mutate(detail.id)}
          title="Remove this category from the month"
          className="rounded p-1.5 text-red-500 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

function StartBalanceEditor({ budget }: { budget: MonthlyBudget }) {
  const updateStartBalance = useUpdateStartBalance()
  const [value, setValue] = useState(String(budget.start_balance))

  useEffect(() => {
    setValue(String(budget.start_balance))
  }, [budget.start_balance])

  function handleBlur() {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed === budget.start_balance) return
    updateStartBalance.mutate({ id: budget.id, startBalance: parsed })
  }

  return (
    <MoneyInput
      value={value}
      onChange={setValue}
      onBlur={handleBlur}
      className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
    />
  )
}

function AddCategoryToBudget({
  monthlyBudgetId,
  excludeCategoryIds,
}: {
  monthlyBudgetId: string
  excludeCategoryIds: string[]
}) {
  const { data: categories } = useCategories()
  const upsertDetail = useUpsertBudgetDetail(monthlyBudgetId)
  const [categoryId, setCategoryId] = useState('')

  const available = (categories ?? []).filter(
    (c) => c.type === 'expense' && !excludeCategoryIds.includes(c.id),
  )

  function handleAdd() {
    if (!categoryId) return
    upsertDetail.mutate(
      { categoryId, budgetAmount: 0 },
      { onSuccess: () => setCategoryId('') },
    )
  }

  if (available.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">+ Add category to this month...</option>
        {available.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={!categoryId || upsertDetail.isPending}
        className="shrink-0 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
      >
        Add
      </button>
    </div>
  )
}

export function Budget() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Budget</h1>
        <button
          onClick={handleCreateMonth}
          disabled={createBudget.isPending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          + Create new month
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : !budgets || budgets.length === 0 ? (
        <p className="text-sm text-slate-500">
          No budget months yet. Click "Create new month" to get started.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonthId ?? ''}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {formatMonthLabel(b.month.slice(0, 7))}
                </option>
              ))}
            </select>
            {selectedBudget && (
              <button
                onClick={handleDeleteMonth}
                disabled={deleteBudget.isPending}
                className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete month
              </button>
            )}
          </div>

          {selectedBudget && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Start Balance
                </span>
                <StartBalanceEditor budget={selectedBudget} />
              </div>

              {detailsLoading ? (
                <p className="text-sm text-slate-500">Loading categories...</p>
              ) : !details || details.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No expense categories to budget yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
                          Category
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">
                          Budget Amount
                        </th>
                        <th className="w-10 px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((detail) => (
                        <BudgetDetailRow
                          key={detail.id}
                          detail={detail}
                          monthlyBudgetId={selectedBudget.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <AddCategoryToBudget
                monthlyBudgetId={selectedBudget.id}
                excludeCategoryIds={(details ?? []).map((d) => d.category.id)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
