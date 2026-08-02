import { Pencil, Trash2, X, Check } from 'lucide-react'
import { useCategoriesViewModel } from './Categories.viewModel'

export function CategoriesSettings() {
  const {
    tab,
    setTab,
    filtered,
    isLoading,
    name,
    setName,
    isCreating,
    handleCreate,
    editingId,
    editingName,
    setEditingName,
    startEdit,
    cancelEdit,
    saveEdit,
    handleDelete,
    toggleDebtRelated,
  } = useCategoriesViewModel()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Categories</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('expense')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'expense' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Expense
        </button>
        <button
          onClick={() => setTab('income')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'income' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${tab === 'expense' ? 'Expense' : 'Income'} category name`}
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
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
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {filtered.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-2 px-4 py-2.5"
            >
              {editingId === category.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                />
              ) : (
                <span className="min-w-0 truncate text-sm text-slate-800">
                  {category.name}
                </span>
              )}

              <div className="flex shrink-0 items-center gap-2">
                {editingId !== category.id && (
                  // "Debt-related" flags a category (e.g. Paid For / Debt Gather)
                  // as pass-through money — excluded from dashboard KPIs and
                  // tracked on the /debts page instead.
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={category.is_debt_related}
                      onChange={() => toggleDebtRelated(category)}
                    />
                    Debt-related
                  </label>
                )}
                {editingId === category.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(category)}
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
                      onClick={() => startEdit(category)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
