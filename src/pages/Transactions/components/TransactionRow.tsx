import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { MoneyInput } from "../../../components/MoneyInput";
import { useAccounts } from "../../../hooks/useAccounts";
import { useCategories } from "../../../hooks/useCategories";
import {
  useDeleteTransaction,
  useUpdateTransaction,
} from "../../../hooks/useTransactions";
import type { TransactionRowProps } from "../Transactions.types";

const typeLabel: Record<string, string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(transaction.date);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [fromAccountId, setFromAccountId] = useState(
    transaction.from_account_id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(
    transaction.to_account_id ?? "",
  );

  const activeAccounts = (accounts ?? []).filter((a) => a.is_active);
  const categoryOptions = (categories ?? []).filter(
    (c) => c.type === (transaction.type === "income" ? "income" : "expense"),
  );

  function startEdit() {
    setDate(transaction.date);
    setAmount(String(transaction.amount));
    setDescription(transaction.description ?? "");
    setCategoryId(transaction.category_id ?? "");
    setFromAccountId(transaction.from_account_id ?? "");
    setToAccountId(transaction.to_account_id ?? "");
    setEditing(true);
  }

  function handleSave() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    updateTransaction.mutate(
      {
        id: transaction.id,
        date,
        amount: parsedAmount,
        description,
        categoryId: transaction.type === "transfer" ? null : categoryId || null,
        fromAccountId:
          transaction.type === "income" ? null : fromAccountId || null,
        toAccountId:
          transaction.type === "expense" ? null : toAccountId || null,
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleDelete() {
    if (!window.confirm("Delete this transaction?")) return
    deleteTransaction.mutate(transaction.id)
  }

  if (editing) {
    return (
      <tr className="border-b border-slate-100 bg-slate-50 last:border-0">
        <td className="px-3 py-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-3 py-2 text-sm text-slate-500">
          {typeLabel[transaction.type]}
        </td>
        <td className="px-3 py-2">
          {transaction.type === "transfer" ? (
            <span className="text-sm text-slate-500">Transfer</span>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="px-3 py-2">
          {transaction.type === "transfer" ? (
            <div className="flex items-center gap-1">
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">—</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">→</span>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">—</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={
                transaction.type === "expense" ? fromAccountId : toAccountId
              }
              onChange={(e) =>
                transaction.type === "expense"
                  ? setFromAccountId(e.target.value)
                  : setToAccountId(e.target.value)
              }
              className="w-36 rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="px-3 py-2">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            className="w-28 rounded border border-slate-300 px-2 py-1 text-right text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="rounded p-1.5 text-green-600 hover:bg-green-100"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-200"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="rounded p-1.5 text-red-500 hover:bg-red-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const accountLabel =
    transaction.type === "transfer"
      ? `${transaction.from_account?.name ?? "—"} → ${transaction.to_account?.name ?? "—"}`
      : ((transaction.type === "expense"
          ? transaction.from_account?.name
          : transaction.to_account?.name) ?? "—");

  const amountClass =
    transaction.type === "income"
      ? "text-green-600"
      : transaction.type === "expense"
        ? "text-red-600"
        : "text-slate-700";

  return (
    <tr
      onClick={startEdit}
      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
    >
      <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-600">
        {transaction.date}
      </td>
      <td
        className={`whitespace-nowrap px-3 py-2 text-sm ${transaction.type == "income" ? "text-green-600" : transaction.type === "expense" ? "text-red-600" : "text-slate-700"}`}
      >
        {typeLabel[transaction.type]}
      </td>
      <td className="max-w-40 truncate px-3 py-2 text-sm text-slate-800">
        {transaction.category?.name ?? "—"}
      </td>
      <td className="max-w-48 truncate px-3 py-2 text-sm text-slate-600">
        {accountLabel}
      </td>
      <td
        className={`whitespace-nowrap px-3 py-2 text-right text-sm font-medium ${amountClass}`}
      >
        {Number(transaction.amount).toLocaleString("en-US")}
      </td>
      <td className="max-w-56 truncate px-3 py-2 text-sm text-slate-600">
        {transaction.description ?? ""}
      </td>
      <td className="px-3 py-2"></td>
    </tr>
  );
}
