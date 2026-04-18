import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDerivClient, type ConnectionStatus } from "@/lib/deriv";
import { Button } from "@/components/ui/button";
import { Activity, LayoutDashboard, AppWindow, KeyRound, Settings, LogOut, Menu, X, Loader2 } from "lucide-react";

const statusColor: Record<ConnectionStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-warning animate-pulse",
  open: "bg-warning animate-pulse",
  authorized: "bg-success",
  closed: "bg-muted-foreground",
  error: "bg-destructive",
};

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/apps", label: "My Apps", icon: AppWindow, exact: false },
  { to: "/tokens", label: "API Tokens", icon: KeyRound, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppShell() {
  const { isAuthenticated, activeToken, session, logout, switchAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) void navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  // Keep a single live websocket authorized — every page reuses it.
  useEffect(() => {
    if (!activeToken) return;
    const client = getDerivClient();
    const off = client.onStatus((s) => setStatus(s));
    void client.authorize(activeToken).catch(() => {});
    return () => {
      off();
    };
  }, [activeToken]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-tight">Deriv Affiliate</div>
                <div className="text-xs text-muted-foreground">Live dashboard</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs sm:flex">
              <span className={`h-2 w-2 rounded-full ${statusColor[status]}`} />
              <span className="capitalize text-muted-foreground">{status}</span>
            </div>

            {session && session.accounts.length > 1 && (
              <select
                value={session.activeAccount}
                onChange={(e) => switchAccount(e.target.value)}
                className="hidden rounded-md border border-border bg-background px-2 py-1.5 text-xs sm:block"
              >
                {session.accounts.map((a) => (
                  <option key={a.account} value={a.account}>
                    {a.account} {a.currency ? `(${a.currency})` : ""}
                  </option>
                ))}
              </select>
            )}

            <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
              <LogOut className="mr-1.5 h-4 w-4" />
              Logout
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border/60 bg-card/80 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="mt-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      <Outlet />
    </div>
  );
}
