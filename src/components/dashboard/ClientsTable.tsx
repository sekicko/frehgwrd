import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProfitRow } from "@/lib/useDerivData";

// Group profit_table rows by app_id — these are the apps that produced
// affiliate / markup activity for the authorized account.
export function ClientsTable({ rows, currency }: { rows: ProfitRow[]; currency: string }) {
  const byApp = new Map<
    number,
    { app_id: number; trades: number; volume: number; pnl: number; lastTs: number }
  >();
  for (const r of rows) {
    const id = r.app_id ?? 0;
    const entry = byApp.get(id) ?? {
      app_id: id,
      trades: 0,
      volume: 0,
      pnl: 0,
      lastTs: 0,
    };
    entry.trades += 1;
    entry.volume += Number(r.buy_price) || 0;
    entry.pnl += (Number(r.sell_price) || 0) - (Number(r.buy_price) || 0);
    entry.lastTs = Math.max(entry.lastTs, (r.sell_time ?? r.purchase_time ?? 0) * 1000);
    byApp.set(id, entry);
  }
  const apps = Array.from(byApp.values()).sort((a, b) => b.volume - a.volume);

  if (!apps.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 text-sm text-muted-foreground">
        No connected apps with activity yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>App ID</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Net P&L</TableHead>
            <TableHead className="text-right">Last activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((a) => (
            <TableRow key={a.app_id} className="border-border/60">
              <TableCell className="font-mono text-xs">
                {a.app_id || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.trades}</TableCell>
              <TableCell className="text-right tabular-nums">
                {a.volume.toFixed(2)} {currency}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums ${a.pnl >= 0 ? "text-success" : "text-destructive"}`}
              >
                {a.pnl >= 0 ? "+" : ""}
                {a.pnl.toFixed(2)} {currency}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {a.lastTs ? new Date(a.lastTs).toLocaleString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
