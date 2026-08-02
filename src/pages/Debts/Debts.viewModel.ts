import { useMemo, useState } from 'react'
import { useAccounts } from '../../hooks/useAccounts'
import { useCategories } from '../../hooks/useCategories'
import {
  useDebtTransactions,
  useDeleteDebt,
  useSetExpectRepayment,
  useSettleDebt,
  useUnsettleDebt,
} from '../../hooks/useTransactions'
import { todayDateString } from '../../lib/month'
import type { TransactionWithRelations } from '../../types/database'
import type { DebtAction, SettleDialogState } from './Debts.types'

export function useDebtsViewModel() {
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const settleDebt = useSettleDebt()
  const setExpectRepayment = useSetExpectRepayment()
  const unsettleDebt = useUnsettleDebt()
  const deleteDebt = useDeleteDebt()

  const debtCategoryIds = useMemo(
    () => (categories ?? []).filter((c) => c.is_debt_related).map((c) => c.id),
    [categories],
  )

  const { data: transactions, isLoading } = useDebtTransactions(debtCategoryIds)

  const [settleDialog, setSettleDialog] = useState<SettleDialogState | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  // "No return" (expect_repayment = false) is split out from "Unpaid" so it
  // never looks like an outstanding debt — it's a real expense the user has
  // decided not to collect on, not something pending.
  const unpaid = (transactions ?? []).filter(
    (t) => !t.is_settled && t.expect_repayment,
  )
  const noReturn = (transactions ?? []).filter(
    (t) => !t.is_settled && !t.expect_repayment,
  )
  const paid = (transactions ?? []).filter((t) => t.is_settled)

  const activeAccounts = (accounts ?? []).filter((a) => a.is_active)

  function openSettleDialog(transaction: TransactionWithRelations) {
    setError(null)
    setSettleDialog({
      transaction,
      accountId: transaction.from_account_id ?? '',
      date: todayDateString(),
    })
  }

  function closeSettleDialog() {
    setSettleDialog(null)
  }

  function updateSettleAccountId(accountId: string) {
    setSettleDialog((s) => (s ? { ...s, accountId } : s))
  }

  function updateSettleDate(date: string) {
    setSettleDialog((s) => (s ? { ...s, date } : s))
  }

  function confirmSettle() {
    if (!settleDialog) return
    if (!settleDialog.accountId) {
      setError('Select an account')
      return
    }
    settleDebt.mutate(
      {
        transactionId: settleDialog.transaction.id,
        accountId: settleDialog.accountId,
        date: settleDialog.date,
      },
      {
        onSuccess: () => setSettleDialog(null),
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'Failed to settle debt'),
      },
    )
  }

  // Single entry point for changing "expect repayment", used for both the
  // Unpaid <-> No return flip and the Paid -> {Unpaid,No return} flip. If the
  // debt was already settled, reopening it must also undo the linked
  // repayment transaction (via the unsettle_debt RPC); otherwise it's just a
  // plain field update since nothing was settled yet.
  function updateExpectRepayment(
    transaction: TransactionWithRelations,
    expectRepayment: boolean,
  ) {
    if (transaction.is_settled) {
      if (
        !window.confirm(
          'Undo this payment? The linked repayment transaction will be deleted too.',
        )
      ) {
        return
      }
      unsettleDebt.mutate({ transactionId: transaction.id, expectRepayment })
      return
    }
    if (
      !expectRepayment &&
      !window.confirm('Mark this as no-return? It will count as a real expense.')
    ) {
      return
    }
    setExpectRepayment.mutate({ transactionId: transaction.id, expectRepayment })
  }

  function remove(transaction: TransactionWithRelations) {
    if (
      !window.confirm(
        transaction.is_settled
          ? 'Delete this debt? Its linked repayment transaction will be deleted too.'
          : 'Delete this debt?',
      )
    ) {
      return
    }
    deleteDebt.mutate(transaction.id)
  }

  // One place that decides which actions apply to a debt, based purely on
  // its own state — avoids re-deriving "which buttons for which group" in
  // the view for Unpaid/No return/Paid separately.
  function getDebtActions(transaction: TransactionWithRelations): DebtAction[] {
    const actions: DebtAction[] = []
    const noReturnAction: DebtAction = {
      key: 'noreturn',
      label: 'No return',
      variant: 'default',
      onClick: () => updateExpectRepayment(transaction, false),
    }
    const markUnpaidAction: DebtAction = {
      key: 'unpaid',
      label: 'Mark unpaid',
      variant: 'default',
      onClick: () => updateExpectRepayment(transaction, true),
    }

    if (!transaction.is_settled) {
      actions.push({
        key: 'settle',
        label: 'Mark as paid',
        variant: 'primary',
        onClick: () => openSettleDialog(transaction),
      })
      // Only one direction makes sense here: flip toward whichever state
      // it's not currently in.
      actions.push(transaction.expect_repayment ? noReturnAction : markUnpaidAction)
    } else {
      // A settled debt can be reopened toward either state, so offer both.
      actions.push(markUnpaidAction, noReturnAction)
    }

    actions.push({
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: () => remove(transaction),
    })

    return actions
  }

  return {
    isLoading,
    unpaid,
    noReturn,
    paid,
    activeAccounts,
    settleDialog,
    error,
    openSettleDialog,
    closeSettleDialog,
    updateSettleAccountId,
    updateSettleDate,
    confirmSettle,
    isSettling: settleDebt.isPending,
    getDebtActions,
  }
}
