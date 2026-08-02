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
import { ChartCard } from "../../components/ChartCard";
import { CurrencyTooltip } from "../../components/CurrencyTooltip";
import { StatCard } from "../../components/StatCard";
import { COLOR, formatCurrency } from "../../lib/chartFormat";
import { formatMonthLabel } from "../../lib/month";
import { useDashboardViewModel } from "./Dashboard.viewModel";

const RADIAN = Math.PI / 180;

type PieSliceLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
};

function renderPieSlicePercent({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieSliceLabelProps) {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export function Dashboard() {
  const {
    user,
    budgets,
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
    topCategoriesCount,
  } = useDashboardViewModel();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        {budgets.length > 0 && (
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
            <StatCard
              label="Start balance"
              value={kpis.startBalance}
              breakdown={accountBreakdowns.startBalance}
            />
            <StatCard label="Total Income" value={kpis.income} />
            <StatCard
              label="Budgeted"
              value={kpis.budgeted}
              subStat={{ label: "Left to budget", value: kpis.leftToBudget }}
            />
            <StatCard
              label="Total spent"
              value={kpis.expense}
              breakdown={accountBreakdowns.totalSpent}
            />
            <StatCard
              label="Left over"
              value={kpis.leftOver}
              tone="negative"
              breakdown={accountBreakdowns.leftOver}
            />
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

                {budgetVsActual.length > topCategoriesCount && (
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
            <ChartCard title="Income breakdown by category">
              {incomeBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">No income this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={incomeBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={renderPieSlicePercent}
                      labelLine={false}
                    >
                      {incomeBreakdown.map((entry) => (
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
                      label={renderPieSlicePercent}
                      labelLine={false}
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
