import { useEffect, useState } from 'react'
import { MoneyInput } from '../../../components/MoneyInput'
import { useUpdateAccountBalance } from '../../../hooks/useMonthlyBudgets'
import type { AccountBalanceRowProps } from '../Budget.types'

export function AccountBalanceRow({ balance, monthlyBudgetId }: AccountBalanceRowProps) {
  const updateBalance = useUpdateAccountBalance(monthlyBudgetId)
  const [value, setValue] = useState(String(balance.start_balance))

  useEffect(() => {
    setValue(String(balance.start_balance))
  }, [balance.start_balance])

  function handleBlur() {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed === balance.start_balance) return
    updateBalance.mutate({ accountId: balance.account.id, startBalance: parsed })
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-sm text-slate-700">{balance.account.name}</span>
      <MoneyInput
        value={value}
        onChange={setValue}
        onBlur={handleBlur}
        className="w-36 shrink-0 rounded border border-slate-300 px-2 py-1 text-right text-sm"
      />
    </div>
  )
}
