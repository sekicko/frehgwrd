import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AppBreakdownRow, AppInfo } from "@/lib/useCommissionStats";

type Props = {
  apps: AppInfo[];
  breakdown: AppBreakdownRow[];
  rangeLabel: string;
};

export function AppCommissionsTable({ apps, breakdown, rangeLabel }: Props) {
  // Merge: every owned app, plus stats per app id.
  const statsByApp = new Map(breakdown.map((b) => [b.app_id, b]));
  const allIds = new Set<number>([
    ...apps.map((a) => a.app_id),
    ...breakdown.map((b) => b.app_id),
  ]);
  const rows = Array.from(allIds).map((id) => {
    const app = apps.find((a) => a.app_id === id);
    const stats = statsByApp.get(id);
    return {
      app_id: id,
      name: app?.name ?? `App ${id}`,
      active: app?.active,
      app_markup_usd: stats?.app_markup_usd ?? 0,
      transactions_count: stats?.transactions_count ?? 0,
      currency: stats?.dev_currcode ?? "USD",
    };
  });
  rows.sort((a, b) => b.app_markup_usd - a.app_markup_usd);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">Commission by app</h3>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>App</TableHead>
            <TableHead>App ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
            <TableHead className="text-right">Commission (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                No apps or commission activity for this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.app_id} className="border-border/60">
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.app_id}
                </TableCell>
                <TableCell>
                  {r.active === 1 ? (
                    <Badge variant="secondary" className="bg-success/15 text-success">
                      Active
                    </Badge>
                  ) : r.active === 0 ? (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Inactive
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.transactions_count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {r.app_markup_usd.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
