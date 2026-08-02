import { formatCurrency } from '../lib/chartFormat'

type CurrencyTooltipPayloadItem = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  payload?: { fill?: string };
};

type CurrencyTooltipProps = {
  active?: boolean;
  payload?: CurrencyTooltipPayloadItem[];
  label?: string;
};

export function CurrencyTooltip({ active, payload, label }: CurrencyTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      {label && <p className="mb-1 font-medium text-slate-900">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey ?? entry.name} className="text-slate-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
          />
          {entry.name}: {formatCurrency(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}
