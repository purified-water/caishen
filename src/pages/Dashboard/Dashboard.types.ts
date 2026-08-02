export type Kpis = {
  income: number;
  expense: number;
  budgeted: number;
  startBalance: number;
  leftOver: number;
};

export type BreakdownItem = { name: string; value: number };

export type AccountBreakdowns = {
  startBalance: BreakdownItem[];
  totalSpent: BreakdownItem[];
  leftOver: BreakdownItem[];
};

export type BudgetVsActualRow = {
  name: string;
  Budget: number;
  Actual: number;
};

export type PieDatum = { name: string; value: number; color: string };
