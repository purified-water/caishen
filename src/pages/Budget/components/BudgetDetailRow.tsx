import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { MoneyInput } from '../../../components/MoneyInput'
import {
  useRemoveBudgetDetail,
  useUpsertBudgetDetail,
} from '../../../hooks/useMonthlyBudgets'
import type { BudgetDetailRowProps } from '../Budget.types'

export function BudgetDetailRow({ detail, monthlyBudgetId }: BudgetDetailRowProps) {
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
