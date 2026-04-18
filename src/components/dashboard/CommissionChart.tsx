import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProfitRow } from "@/lib/useDerivData";

// Aggregate real profit_table rows into a daily P&L series.
function buildSeries(rows: ProfitRow[]) {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const ts = (r.sell_time ?? r.purchase_time ?? 0) * 1000;
    if (!ts) continue;
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const pnl = (Number(r.sell_price) || 0) - (Number(r.buy_price) || 0);
    byDay.set(key, (byDay.get(key) ?? 0) + pnl);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl: Number(pnl.toFixed(2)) }));
}

export function CommissionChart({ rows, currency }: { rows: ProfitRow[]; currency: string }) {
  const data = buildSeries(rows);

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 text-sm text-muted-foreground">
        No transaction history available for this account yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.18 145)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="oklch(0.78 0.18 145)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "oklch(0.70 0.02 255)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "oklch(0.70 0.02 255)" }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.21 0.025 255)",
              border: "1px solid oklch(0.30 0.03 255)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "oklch(0.97 0.01 250)" }}
            formatter={(v: number) => [`${v.toFixed(2)} ${currency}`, "P&L"]}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="oklch(0.78 0.18 145)"
            strokeWidth={2}
            fill="url(#pnl)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
