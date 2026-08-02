import { Pencil, Trash2, X, Check } from 'lucide-react'
import type { AccountType } from '../../../types/database'
import { useAccountsViewModel } from './Accounts.viewModel'

export function AccountsSettings() {
  const {
    accounts,
    isLoading,
    name,
    setName,
    type,
    setType,
    isCreating,
    handleCreate,
    editingId,
    editingName,
    setEditingName,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleActive,
    handleDelete,
  } = useAccountsViewModel()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Accounts</h1>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Account name (e.g. TPBank, Cash)"
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="shrink-0 rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
        </select>
        <button
          type="submit"
          disabled={isCreating}
          className="shrink-0 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-slate-500">No accounts yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {editingId === account.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="min-w-0 truncate text-sm text-slate-800">
                    {account.name}
                  </span>
                )}
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {account.type}
                </span>
                {!account.is_active && (
                  <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    inactive
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {editingId === account.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(account)}
                      className="rounded p-1.5 text-green-600 hover:bg-green-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleActive(account)}
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      {account.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => startEdit(account)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
