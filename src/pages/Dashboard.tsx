import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useMonthTransactions } from "../hooks/useDashboard";
import {
  useBudgetDetails,
  useMonthlyBudgets,
} from "../hooks/useMonthlyBudgets";
import { formatMonthLabel } from "../lib/month";

const COLOR = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
};

const CATEGORY_COLORS = [
  COLOR.blue,
  COLOR.orange,
  COLOR.aqua,
  COLOR.yellow,
  COLOR.magenta,
];

const TOP_CATEGORIES_COUNT = 10;

function formatCurrency(value: number) {
  return value.toLocaleString("en-US");
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "negative";
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${tone === "negative" && value < 0 ? "text-red-600" : "text-slate-900"}`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      {label && <p className="mb-1 font-medium text-slate-900">{label}</p>}
      {payload.map((entry: any) => (
        <p key={entry.dataKey ?? entry.name} className="text-slate-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
          />
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function Dashboard() {
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

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  );

  const kpis = useMemo(() => {
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
    return { income, expense, budgeted, startBalance, leftOver };
  }, [transactions, details, selectedBudget]);

  const budgetVsActual = useMemo(() => {
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

  const incomeExpenseSavings = useMemo(() => {
    const savings = Math.max(kpis.leftOver, 0);
    return [
      { name: "Income", value: kpis.income, color: COLOR.blue },
      { name: "Expense", value: kpis.expense, color: COLOR.orange },
      { name: "Savings", value: savings, color: COLOR.aqua },
    ].filter((d) => d.value > 0);
  }, [kpis]);

  const expenseBreakdown = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        {budgets && budgets.length > 0 && (
          <select
            value={selectedMonthId ?? ""}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {formatMonthLabel(b.month.slice(0, 7))}
              </option>
            ))}
          </select>
        )}
      </div>

      {budgetsLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : !selectedBudget ? (
        <p className="text-sm text-slate-500">
          No budget months yet. Logged in as {user?.email}. Create one in Budget
          to see your dashboard.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Start balance" value={kpis.startBalance} />
            <StatCard label="Income" value={kpis.income} />
            <StatCard label="Budgeted" value={kpis.budgeted} />
            <StatCard label="Total spent" value={kpis.expense} />
            <StatCard label="Left over" value={kpis.leftOver} tone="negative" />
          </div>

          <ChartCard title="Budget vs Actual by category">
            {budgetVsActual.length === 0 ? (
              <p className="text-sm text-slate-500">
                No budgeted categories this month.
              </p>
            ) : (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(visibleBudgetVsActual.length * 42, 120)}
                >
                  <BarChart
                    data={visibleBudgetVsActual}
                    layout="vertical"
                    barGap={2}
                    barCategoryGap="20%"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={COLOR.grid}
                      strokeDasharray="0"
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: COLOR.axis, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCurrency}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: COLOR.axis, fontSize: 11 }}
                      axisLine={{ stroke: COLOR.axis }}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="Budget"
                      fill={COLOR.blue}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="Actual"
                      fill={COLOR.orange}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {budgetVsActual.length > TOP_CATEGORIES_COUNT && (
                  <button
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    {showAllCategories
                      ? "Show top 10 only"
                      : `Show ${hiddenCategoryCount} more`}
                  </button>
                )}
              </>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChartCard title="Income vs Expense vs Savings">
              {incomeExpenseSavings.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No transactions this month.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={incomeExpenseSavings}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {incomeExpenseSavings.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Expense breakdown by category">
              {expenseBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No expenses this month.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {expenseBreakdown.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
