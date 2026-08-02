import { useState, type FormEvent } from 'react'
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../../../hooks/useAccounts'
import type { Account, AccountType } from '../../../types/database'

export function useAccountsViewModel() {
  const { data: accounts, isLoading } = useAccounts()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createAccount.mutate(
      { name: name.trim(), type },
      { onSuccess: () => setName('') },
    )
  }

  function startEdit(account: Account) {
    setEditingId(account.id)
    setEditingName(account.name)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(account: Account) {
    if (!editingName.trim()) return
    updateAccount.mutate(
      {
        id: account.id,
        name: editingName.trim(),
        type: account.type,
        is_active: account.is_active,
      },
      { onSuccess: () => setEditingId(null) },
    )
  }

  function toggleActive(account: Account) {
    updateAccount.mutate({
      id: account.id,
      name: account.name,
      type: account.type,
      is_active: !account.is_active,
    })
  }

  function handleDelete(accountId: string) {
    deleteAccount.mutate(accountId)
  }

  return {
    accounts: accounts ?? [],
    isLoading,
    name,
    setName,
    type,
    setType,
    isCreating: createAccount.isPending,
    handleCreate,
    editingId,
    editingName,
    setEditingName,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleActive,
    handleDelete,
  }
}
