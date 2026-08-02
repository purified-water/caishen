import { useState, type FormEvent } from 'react'
import { useAccounts } from '../../hooks/useAccounts'
import { useCategories } from '../../hooks/useCategories'
import { useCreateTransaction } from '../../hooks/useTransactions'
import { todayDateString } from '../../lib/month'
import type { TransactionType } from '../../types/database'

export function useQuickLogSheetViewModel(onClose: () => void) {
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()

  const [type, setType] = useState<TransactionType>('expense')
  const [date, setDate] = useState(todayDateString())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeAccounts = (accounts ?? []).filter((a) => a.is_active)
  const filteredCategories = (categories ?? []).filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type),
  )

  function reset() {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setFromAccountId('')
    setToAccountId('')
    setError(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        setError('Select both source and destination accounts')
        return
      }
      if (fromAccountId === toAccountId) {
        setError('Source and destination accounts must be different')
        return
      }
    } else if (type === 'expense' && !fromAccountId) {
      setError('Select an account')
      return
    } else if (type === 'income' && !toAccountId) {
      setError('Select an account')
      return
    }

    createTransaction.mutate(
      {
        type,
        date,
        amount: parsedAmount,
        description,
        categoryId: type === 'transfer' ? null : categoryId || null,
        fromAccountId: type === 'income' ? null : fromAccountId || null,
        toAccountId: type === 'expense' ? null : toAccountId || null,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'Failed to save transaction'),
      },
    )
  }

  return {
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
    isSaving: createTransaction.isPending,
  }
}
