import type { TransactionWithRelations } from '../../types/database'

export type SettleDialogState = {
  transaction: TransactionWithRelations
  accountId: string
  date: string
}

export type DebtAction = {
  key: string
  label: string
  variant: 'primary' | 'default' | 'danger'
  onClick: () => void
}
