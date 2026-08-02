import { useState } from 'react'
import { useCategories } from '../../../hooks/useCategories'
import { useUpsertBudgetDetail } from '../../../hooks/useMonthlyBudgets'
import type { AddCategoryToBudgetProps } from '../Budget.types'

export function AddCategoryToBudget({ monthlyBudgetId, excludeCategoryIds }: AddCategoryToBudgetProps) {
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
