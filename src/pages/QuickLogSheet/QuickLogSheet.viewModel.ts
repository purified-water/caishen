import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAccounts } from '../../hooks/useAccounts'
import { useCategories } from '../../hooks/useCategories'
import { useCreateTransaction } from '../../hooks/useTransactions'
import { todayDateString } from '../../lib/month'
import type { Category, TransactionType } from '../../types/database'

export function useQuickLogSheetViewModel(onClose: () => void) {
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()

  const [type, setType] = useState<TransactionType>('expense')
  const [date, setDate] = useState(todayDateString())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [expectRepayment, setExpectRepayment] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeAccounts = (accounts ?? []).filter((a) => a.is_active)
  const filteredCategories = (categories ?? []).filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type),
  )

  const selectedCategory = (categories ?? []).find((c) => c.id === categoryId)
  const isDebtRelated =
    type === 'expense' && !!selectedCategory?.is_debt_related

  useEffect(() => {
    setCategoryInput('')
    setCategoryId('')
  }, [type])

  // Clear debt-only fields when switching away from a debt-related category
  // so a stale counterparty/flag doesn't get submitted with an unrelated expense.
  useEffect(() => {
    if (!isDebtRelated) {
      setCounterpartyName('')
      setExpectRepayment(true)
    }
  }, [isDebtRelated])

  const categorySuggestions = useMemo(() => {
    const query = categoryInput.trim().toLowerCase()
    if (!query) return filteredCategories
    return filteredCategories.filter((c) =>
      c.name.toLowerCase().includes(query),
    )
  }, [filteredCategories, categoryInput])

  const categoryError = useMemo(() => {
    const query = categoryInput.trim()
    if (!query) return null
    const hasExactMatch = filteredCategories.some(
      (c) => c.name.toLowerCase() === query.toLowerCase(),
    )
    return hasExactMatch
      ? null
      : 'No matching category. Pick a suggestion or type the exact name.'
  }, [filteredCategories, categoryInput])

  function handleCategoryInputChange(value: string) {
    setCategoryInput(value)
    const match = filteredCategories.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase(),
    )
    setCategoryId(match ? match.id : '')
  }

  function selectCategory(category: Category) {
    setCategoryInput(category.name)
    setCategoryId(category.id)
    setShowCategorySuggestions(false)
  }

  function reset() {
    setAmount('')
    setDescription('')
    setCategoryInput('')
    setCategoryId('')
    setFromAccountId('')
    setToAccountId('')
    setCounterpartyName('')
    setExpectRepayment(true)
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

    if (categoryError) {
      setError(categoryError)
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
        counterpartyName: isDebtRelated ? counterpartyName || null : null,
        expectRepayment: isDebtRelated ? expectRepayment : true,
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
    categoryInput,
    categoryError,
    categorySuggestions,
    showCategorySuggestions,
    setShowCategorySuggestions,
    handleCategoryInputChange,
    selectCategory,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    isDebtRelated,
    counterpartyName,
    setCounterpartyName,
    expectRepayment,
    setExpectRepayment,
    error,
    activeAccounts,
    handleSubmit,
    isSaving: createTransaction.isPending,
  }
}
