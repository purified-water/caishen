import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useMonthTransactions } from "../../hooks/useDashboard";
import {
  useAccountBalances,
  useBudgetDetails,
  useMonthlyBudgets,
} from "../../hooks/useMonthlyBudgets";
import { CATEGORY_COLORS, COLOR } from "../../lib/chartFormat";
import type {
  AccountBreakdowns,
  BudgetVsActualRow,
  Kpis,
  PieDatum,
} from "./Dashboard.types";

const TOP_CATEGORIES_COUNT = 10;

export function useDashboardViewModel() {
  const { user } = useAuth();
  const { data: budgets, isLoading: budgetsLoading } = useMonthlyBudgets();
  const { data: categories } = useCategories();
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (!selectedMonthId && budgets && budgets.length > 0) {
      setSelectedMonthId(budgets[0].id);
    }
  }, [budgets, selectedMonthId]);

  const selectedBudget = budgets?.find((b) => b.id === selectedMonthId) ?? null;
  const { data: details } = useBudgetDetails(selectedBudget?.id ?? null);
  const { data: transactions } = useMonthTransactions(
    selectedBudget?.id ?? null,
  );
  const { data: accountBalances } = useAccountBalances(
    selectedBudget?.id ?? null,
  );

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  );

  const kpis: Kpis = useMemo(() => {
    const txns = transactions ?? [];
    const income = txns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = txns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const budgeted = (details ?? []).reduce(
      (sum, d) => sum + Number(d.budget_amount),
      0,
    );
    const startBalance = selectedBudget
      ? Number(selectedBudget.start_balance)
      : 0;
    const leftOver = startBalance + income - expense;
    const leftToBudget = budgeted - expense;
    return { income, expense, budgeted, startBalance, leftOver, leftToBudget };
  }, [transactions, details, selectedBudget]);

  const accountBreakdowns: AccountBreakdowns = useMemo(() => {
    const accounts = accountBalances ?? [];
    const txns = transactions ?? [];

    const startBalance = accounts.map((b) => ({
      name: b.account.name,
      value: Number(b.start_balance),
    }));

    const totalSpent = accounts.map((b) => {
      const spent = txns
        .filter((t) => t.type === "expense" && t.from_account_id === b.account.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: b.account.name, value: spent };
    });

    const leftOver = accounts.map((b) => {
      const inflow = txns
        .filter(
          (t) =>
            (t.type === "income" && t.to_account_id === b.account.id) ||
            (t.type === "transfer" && t.to_account_id === b.account.id),
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const outflow = txns
        .filter(
          (t) =>
            (t.type === "expense" && t.from_account_id === b.account.id) ||
            (t.type === "transfer" && t.from_account_id === b.account.id),
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: b.account.name, value: Number(b.start_balance) + inflow - outflow };
    });

    return { startBalance, totalSpent, leftOver };
  }, [accountBalances, transactions]);

  const budgetVsActual: BudgetVsActualRow[] = useMemo(() => {
    const actualByCategory = new Map<string, number>();
    (transactions ?? [])
      .filter((t) => t.type === "expense" && t.category_id)
      .forEach((t) => {
        actualByCategory.set(
          t.category_id!,
          (actualByCategory.get(t.category_id!) ?? 0) + Number(t.amount),
        );
      });

    return (details ?? [])
      .map((d) => ({
        name: d.category.name,
        Budget: Number(d.budget_amount),
        Actual: actualByCategory.get(d.category_id) ?? 0,
      }))
      .sort((a, b) => Math.max(b.Budget, b.Actual) - Math.max(a.Budget, a.Actual));
  }, [details, transactions]);

  const visibleBudgetVsActual = showAllCategories
    ? budgetVsActual
    : budgetVsActual.slice(0, TOP_CATEGORIES_COUNT);
  const hiddenCategoryCount = budgetVsActual.length - visibleBudgetVsActual.length;

  const incomeBreakdown: PieDatum[] = useMemo(() => {
    const byCategory = new Map<string, number>();
    (transactions ?? [])
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const key = t.category_id ?? "uncategorized";
        byCategory.set(key, (byCategory.get(key) ?? 0) + Number(t.amount));
      });

    const sorted = Array.from(byCategory.entries())
      .map(([id, value]) => ({
        name:
          id === "uncategorized"
            ? "Uncategorized"
            : (categoryNameById.get(id) ?? "Unknown"),
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const top = sorted
      .slice(0, 5)
      .map((d, i) => ({ ...d, color: CATEGORY_COLORS[i] }));
    const rest = sorted.slice(5).reduce((sum, d) => sum + d.value, 0);
    return rest > 0
      ? [...top, { name: "Other", value: rest, color: COLOR.muted }]
      : top;
  }, [transactions, categoryNameById]);

  const expenseBreakdown: PieDatum[] = useMemo(() => {
    const byCategory = new Map<string, number>();
    (transactions ?? [])
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category_id ?? "uncategorized";
        byCategory.set(key, (byCategory.get(key) ?? 0) + Number(t.amount));
      });

    const sorted = Array.from(byCategory.entries())
      .map(([id, value]) => ({
        name:
          id === "uncategorized"
            ? "Uncategorized"
            : (categoryNameById.get(id) ?? "Unknown"),
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const top = sorted
      .slice(0, 5)
      .map((d, i) => ({ ...d, color: CATEGORY_COLORS[i] }));
    const rest = sorted.slice(5).reduce((sum, d) => sum + d.value, 0);
    return rest > 0
      ? [...top, { name: "Other", value: rest, color: COLOR.muted }]
      : top;
  }, [transactions, categoryNameById]);

  return {
    user,
    budgets: budgets ?? [],
    budgetsLoading,
    selectedMonthId,
    setSelectedMonthId,
    selectedBudget,
    kpis,
    accountBreakdowns,
    budgetVsActual,
    visibleBudgetVsActual,
    hiddenCategoryCount,
    showAllCategories,
    setShowAllCategories,
    incomeBreakdown,
    expenseBreakdown,
    topCategoriesCount: TOP_CATEGORIES_COUNT,
  };
}
