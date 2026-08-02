import { useEffect, useState } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { useMonthlyBudgets } from "../../hooks/useMonthlyBudgets";
import { useTransactionsList, type TransactionFilters } from "../../hooks/useTransactions";

export function useTransactionsViewModel() {
  const { data: budgets } = useMonthlyBudgets();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const [monthlyBudgetId, setMonthlyBudgetId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters: TransactionFilters = {
    monthlyBudgetId: monthlyBudgetId || undefined,
    categoryId: categoryId || undefined,
    accountId: accountId || undefined,
    search: search || undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useTransactionsList(filters);

  const transactions = data?.pages.flat() ?? [];

  return {
    budgets: budgets ?? [],
    categories: categories ?? [],
    accounts: accounts ?? [],
    monthlyBudgetId,
    setMonthlyBudgetId,
    categoryId,
    setCategoryId,
    accountId,
    setAccountId,
    searchInput,
    setSearchInput,
    transactions,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
