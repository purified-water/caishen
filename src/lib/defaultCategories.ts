import type { CategoryType } from '../types/database'

export const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  // --- Income ---
  { name: 'Salary', type: 'income' },
  { name: 'Interest & Return', type: 'income' },
  { name: 'Debt Gather', type: 'income' },
  { name: 'Refund', type: 'income' },
  { name: 'Other Income', type: 'income' },

  // --- Expense ---
  { name: 'House Rent', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Drinking Water', type: 'expense' },
  { name: 'Meal', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Snack & Drink', type: 'expense' },
  { name: 'Fuel', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Personal Item', type: 'expense' },
  { name: 'Personal Service', type: 'expense' },
  { name: 'Sport & Fitness', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Work', type: 'expense' },
  { name: 'Gift & Donation', type: 'expense' },
  { name: 'Travel', type: 'expense' },
  { name: 'Paid For', type: 'expense' },
  { name: 'Parking', type: 'expense' },
  { name: 'Other Expenses', type: 'expense' },

  // --- Savings & Investing (tracked as expense: money leaving the budget) ---
  { name: 'Investing', type: 'expense' },
  { name: 'Saving', type: 'expense' },
  { name: 'Emergency Fund', type: 'expense' },
]
