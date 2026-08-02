import { useState, type FormEvent } from 'react'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../../hooks/useCategories'
import type { Category, CategoryType } from '../../../types/database'

export function useCategoriesViewModel() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

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

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(category: Category) {
    if (!editingName.trim()) return
    updateCategory.mutate(
      { id: category.id, name: editingName.trim(), type: category.type },
      { onSuccess: () => setEditingId(null) },
    )
  }

  function handleDelete(categoryId: string) {
    deleteCategory.mutate(categoryId)
  }

  return {
    tab,
    setTab,
    filtered,
    isLoading,
    name,
    setName,
    isCreating: createCategory.isPending,
    handleCreate,
    editingId,
    editingName,
    setEditingName,
    startEdit,
    cancelEdit,
    saveEdit,
    handleDelete,
  }
}
