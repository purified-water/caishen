import { AccountBalanceRow } from './components/AccountBalanceRow'
import { AddCategoryToBudget } from './components/AddCategoryToBudget'
import { BudgetDetailRow } from './components/BudgetDetailRow'
import { formatMonthLabel } from '../../lib/month'
import { useBudgetViewModel } from './Budget.viewModel'

export function Budget() {
  const {
    budgets,
    isLoading,
    selectedMonthId,
    setSelectedMonthId,
    selectedBudget,
    details,
    detailsLoading,
    accountBalances,
    balancesLoading,
    error,
    isCreatingBudget,
    isDeletingBudget,
    handleCreateMonth,
    handleDeleteMonth,
  } = useBudgetViewModel()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Budget</h1>
        <button
          onClick={handleCreateMonth}
          disabled={isCreatingBudget}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          + Create new month
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : budgets.length === 0 ? (
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
                disabled={isDeletingBudget}
                className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete month
              </button>
            )}
          </div>

          {selectedBudget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Start Balance by account
                </span>
                {balancesLoading ? (
                  <p className="text-sm text-slate-500">Loading accounts...</p>
                ) : accountBalances.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No active accounts yet. Add one in Accounts settings.
                  </p>
                ) : (
                  <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                    {accountBalances.map((b) => (
                      <AccountBalanceRow
                        key={b.id}
                        balance={b}
                        monthlyBudgetId={selectedBudget.id}
                      />
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                      <span className="text-sm font-semibold text-slate-900">Total</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {accountBalances
                          .reduce((sum, b) => sum + Number(b.start_balance), 0)
                          .toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {detailsLoading ? (
                <p className="text-sm text-slate-500">Loading categories...</p>
              ) : details.length === 0 ? (
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
                excludeCategoryIds={details.map((d) => d.category.id)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
