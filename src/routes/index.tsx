import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useDerivData } from "@/lib/useDerivData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { CommissionChart } from "@/components/dashboard/CommissionChart";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { isAuthenticated, activeToken, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) void navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Dashboard token={activeToken!} accountLabel={session?.activeAccount ?? ""} />;
}

function Dashboard({ token, accountLabel }: { token: string; accountLabel: string }) {
  const { status, data, loading, error, refresh } = useDerivData(token);

  const stats = useMemo(() => {
    if (!data) return null;
    const profit = data.profitTable;
    const totalPnl = profit.reduce(
      (sum, r) => sum + ((Number(r.sell_price) || 0) - (Number(r.buy_price) || 0)),
      0,
    );
    const totalVolume = profit.reduce((sum, r) => sum + (Number(r.buy_price) || 0), 0);
    const trades = profit.length;
    const apps = new Set(profit.map((r) => r.app_id ?? 0)).size;
    const avgVolume = trades ? totalVolume / trades : 0;
    return { totalPnl, totalVolume, trades, apps, avgVolume };
  }, [data]);

  const currency = data?.balance?.currency ?? data?.authorize?.currency ?? "USD";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader status={status} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Top row: title + refresh */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {data?.authorize?.fullname || "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Account{" "}
              <span className="font-mono text-foreground">
                {data?.authorize?.loginid ?? accountLabel}
              </span>
              {data?.authorize?.country ? ` · ${data.authorize.country.toUpperCase()}` : ""}
            </p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="mb-6 flex items-start gap-3 border-destructive/40 bg-destructive/10 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="text-sm">
              <div className="font-medium text-destructive">Failed to load Deriv data</div>
              <div className="mt-0.5 text-destructive/80">{error}</div>
            </div>
          </Card>
        )}

        {loading && !data && (
          <Card className="flex items-center gap-3 border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Connecting to Deriv and loading your live data…
          </Card>
        )}

        {data && stats && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Net P&L"
                accent={stats.totalPnl >= 0 ? "success" : "destructive"}
                value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)} ${currency}`}
                hint="Sum of (sell − buy) on profit table"
              />
              <StatCard
                label="Total trades"
                value={stats.trades.toLocaleString()}
                hint="From profit_table API"
              />
              <StatCard
                label="Active apps"
                accent="accent"
                value={stats.apps.toString()}
                hint="Distinct app_id values"
              />
              <StatCard
                label="Avg. volume / trade"
                value={`${stats.avgVolume.toFixed(2)} ${currency}`}
                hint={`Total volume ${stats.totalVolume.toFixed(2)} ${currency}`}
              />
            </section>

            {data.balance && (
              <section className="mt-6">
                <Card className="flex flex-wrap items-center justify-between gap-4 border-border/60 bg-[image:var(--gradient-card)] p-5">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Account balance
                    </div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">
                      {data.balance.balance.toFixed(2)}{" "}
                      <span className="text-base text-muted-foreground">
                        {data.balance.currency}
                      </span>
                    </div>
                  </div>
                  {data.affiliateError ? (
                    <div className="max-w-md text-right text-xs text-muted-foreground">
                      Affiliate stats: {data.affiliateError}
                    </div>
                  ) : data.affiliate ? (
                    <pre className="max-w-md overflow-auto rounded-md bg-background/40 p-2 text-[10px] text-muted-foreground">
                      {JSON.stringify(data.affiliate, null, 2).slice(0, 400)}
                    </pre>
                  ) : null}
                </Card>
              </section>
            )}

            <section className="mt-6">
              <Card className="border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">Daily P&L</h2>
                  <span className="text-xs text-muted-foreground">
                    Aggregated from live profit_table
                  </span>
                </div>
                <CommissionChart rows={data.profitTable} currency={currency} />
              </Card>
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">Connected apps & clients</h2>
                <span className="text-xs text-muted-foreground">
                  {data.profitTable.length} transactions analyzed
                </span>
              </div>
              <ClientsTable rows={data.profitTable} currency={currency} />
            </section>
          </>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Live data via{" "}
          <span className="font-mono">wss://ws.derivws.com/websockets/v3</span> · App ID{" "}
          <span className="font-mono">133222</span>
        </footer>
      </main>
    </div>
  );
}
