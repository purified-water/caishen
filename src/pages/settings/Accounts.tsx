import { useState, type FormEvent } from 'react'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../../hooks/useAccounts'
import type { Account, AccountType } from '../../types/database'

export function AccountsSettings() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Accounts</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nguồn tiền (VD: TPBank, Cash)"
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
        </select>
        <button
          type="submit"
          disabled={createAccount.isPending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : (accounts ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có nguồn tiền nào.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {(accounts ?? []).map((account) => (
            <li key={account.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                {editingId === account.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="text-sm text-slate-800">{account.name}</span>
                )}
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {account.type}
                </span>
                {!account.is_active && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    inactive
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {editingId === account.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(account)}
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
                      onClick={() => toggleActive(account)}
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      {account.is_active ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      onClick={() => startEdit(account)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteAccount.mutate(account.id)}
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
