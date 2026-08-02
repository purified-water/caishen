import { X } from 'lucide-react'
import { MoneyInput } from '../../components/MoneyInput'
import type { TransactionType } from '../../types/database'
import type { QuickLogSheetProps } from './QuickLogSheet.types'
import { useQuickLogSheetViewModel } from './QuickLogSheet.viewModel'

const typeLabel: Record<TransactionType, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
}

export function QuickLogSheet({ onClose }: QuickLogSheetProps) {
  const {
    type,
    setType,
    date,
    setDate,
    amount,
    setAmount,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    error,
    activeAccounts,
    filteredCategories,
    handleSubmit,
    isSaving,
  } = useQuickLogSheetViewModel(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Add transaction
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(["expense", "income", "transfer"] as TransactionType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                    type === t
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {typeLabel[t]}
                </button>
              ),
            )}
          </div>

          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  From account
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  To account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Account
                </label>
                <select
                  value={type === "expense" ? fromAccountId : toAccountId}
                  onChange={(e) =>
                    type === "expense"
                      ? setFromAccountId(e.target.value)
                      : setToAccountId(e.target.value)
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Amount
              </label>
              <MoneyInput
                value={amount}
                onChange={setAmount}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <label className="text-sm font-medium text-slate-700">Note</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded bg-slate-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
