import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Activity } from "lucide-react";
import type { ConnectionStatus } from "@/lib/deriv";

const statusColor: Record<ConnectionStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-warning animate-pulse",
  open: "bg-warning animate-pulse",
  authorized: "bg-success",
  closed: "bg-muted-foreground",
  error: "bg-destructive",
};

export function DashboardHeader({ status }: { status: ConnectionStatus }) {
  const { session, logout, switchAccount } = useAuth();

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Deriv Affiliate</div>
            <div className="text-xs text-muted-foreground">Live dashboard</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs sm:flex">
            <span className={`h-2 w-2 rounded-full ${statusColor[status]}`} />
            <span className="capitalize text-muted-foreground">{status}</span>
          </div>

          {session && session.accounts.length > 1 && (
            <select
              value={session.activeAccount}
              onChange={(e) => switchAccount(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
              {session.accounts.map((a) => (
                <option key={a.account} value={a.account}>
                  {a.account} {a.currency ? `(${a.currency})` : ""}
                </option>
              ))}
            </select>
          )}

          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
