import { useEffect, useRef } from "react";
import { formatMonthLabel } from "../../lib/month";
import { TransactionRow } from "./components/TransactionRow";
import { useTransactionsViewModel } from "./Transactions.viewModel";

export function Transactions() {
  const {
    budgets,
    categories,
    accounts,
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
  } = useTransactionsViewModel();

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>

      <div className="flex flex-wrap gap-2">
        <select
          value={monthlyBudgetId}
          onChange={(e) => setMonthlyBudgetId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All months</option>
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {formatMonthLabel(b.month.slice(0, 7))}
            </option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search notes..."
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-3 py-2 text-xs font-medium uppercase text-slate-500">
                Date
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase text-slate-500">
                Type
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase text-slate-500">
                Category
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase text-slate-500">
                Account
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase text-slate-500">
                Amount
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase text-slate-500">
                Note
              </th>
              <th className="w-16 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </tbody>
        </table>

        {isLoading ? (
          <p className="px-3 py-4 text-sm text-slate-500">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">
            No transactions yet.
          </p>
        ) : null}

        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <p className="px-3 py-2 text-center text-xs text-slate-400">
            Loading more...
          </p>
        )}
      </div>
    </div>
  );
}
