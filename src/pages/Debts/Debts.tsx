import type { TransactionWithRelations } from "../../types/database";
import type { DebtAction } from "./Debts.types";
import { useDebtsViewModel } from "./Debts.viewModel";

const actionButtonClass: Record<DebtAction["variant"], string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  default: "border border-slate-300 text-slate-600 hover:bg-slate-100",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
};

function DebtRow({
  transaction,
  actions,
}: {
  transaction: TransactionWithRelations;
  actions: DebtAction[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {transaction.counterparty_name || "Unnamed"}
        </p>
        <p className="text-xs text-slate-500">
          {transaction.date} · {transaction.from_account?.name ?? "—"}
          {transaction.description ? ` · ${transaction.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-slate-800">
          {Number(transaction.amount).toLocaleString("en-US")}
        </span>
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ${actionButtonClass[action.variant]}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Debts() {
  const {
    isLoading,
    unpaid,
    noReturn,
    paid,
    activeAccounts,
    settleDialog,
    error,
    closeSettleDialog,
    updateSettleAccountId,
    updateSettleDate,
    confirmSettle,
    isSettling,
    getDebtActions,
  } = useDebtsViewModel();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Debts</h1>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <section className="rounded border border-slate-200 bg-white">
            <h2 className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              Unpaid ({unpaid.length})
            </h2>
            {unpaid.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                Nobody owes you right now.
              </p>
            ) : (
              unpaid.map((t) => (
                <DebtRow key={t.id} transaction={t} actions={getDebtActions(t)} />
              ))
            )}
          </section>

          {noReturn.length > 0 && (
            <section className="rounded border border-slate-200 bg-white">
              <h2 className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                No return ({noReturn.length})
              </h2>
              {noReturn.map((t) => (
                <DebtRow key={t.id} transaction={t} actions={getDebtActions(t)} />
              ))}
            </section>
          )}

          <section className="rounded border border-slate-200 bg-white">
            <h2 className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              Paid ({paid.length})
            </h2>
            {paid.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                No settled debts yet.
              </p>
            ) : (
              paid.map((t) => (
                <DebtRow key={t.id} transaction={t} actions={getDebtActions(t)} />
              ))
            )}
          </section>
        </>
      )}

      {settleDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-lg md:rounded-2xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Mark as paid
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Received into account
                </label>
                <select
                  value={settleDialog.accountId}
                  onChange={(e) => updateSettleAccountId(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={settleDialog.date}
                  onChange={(e) => updateSettleDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeSettleDialog}
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSettle}
                  disabled={isSettling}
                  className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isSettling ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
