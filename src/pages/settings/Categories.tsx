import { useState, type FormEvent } from 'react'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSeedDefaultCategories,
  useUpdateCategory,
} from '../../hooks/useCategories'
import type { Category, CategoryType } from '../../types/database'

export function CategoriesSettings() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const seedDefaults = useSeedDefaultCategories()

  const [tab, setTab] = useState<CategoryType>('expense')
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const filtered = (categories ?? []).filter((c) => c.type === tab)

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createCategory.mutate(
      { name: name.trim(), type: tab },
      { onSuccess: () => setName('') },
    )
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  function saveEdit(category: Category) {
    if (!editingName.trim()) return
    updateCategory.mutate(
      { id: category.id, name: editingName.trim(), type: category.type },
      { onSuccess: () => setEditingId(null) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
        <button
          onClick={() => seedDefaults.mutate(categories ?? [])}
          disabled={seedDefaults.isPending}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          Nhập danh mục mặc định
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('expense')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'expense' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Chi tiêu
        </button>
        <button
          onClick={() => setTab('income')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tab === 'income' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Thu nhập
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Tên danh mục ${tab === 'expense' ? 'chi tiêu' : 'thu nhập'}`}
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có danh mục nào. Bấm "Nhập danh mục mặc định" ở trên để tạo nhanh.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {filtered.map((category) => (
            <li key={category.id} className="flex items-center justify-between px-4 py-2.5">
              {editingId === category.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                />
              ) : (
                <span className="text-sm text-slate-800">{category.name}</span>
              )}

              <div className="flex items-center gap-1">
                {editingId === category.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(category)}
                      className="rounded p-1.5 text-green-600 hover:bg-green-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
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
                      onClick={() => deleteCategory.mutate(category.id)}
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
