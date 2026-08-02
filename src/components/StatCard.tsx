import { formatCurrency } from '../lib/chartFormat'

export function StatCard({
  label,
  value,
  tone,
  breakdown,
}: {
  label: string;
  value: number;
  tone?: "negative";
  breakdown?: { name: string; value: number }[];
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${tone === "negative" && value < 0 ? "text-red-600" : "text-slate-900"}`}
      >
        {formatCurrency(value)}
      </p>
      {breakdown && breakdown.length > 0 && (
        <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5">
          {breakdown.map((b) => (
            <p key={b.name} className="flex justify-between text-xs text-slate-500">
              <span className="truncate">{b.name}</span>
              <span className="ml-2 shrink-0">{formatCurrency(b.value)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
