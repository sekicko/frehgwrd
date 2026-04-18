import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDerivClient, DERIV_APP_ID } from "@/lib/deriv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { activeToken, session, logout, switchAccount } = useAuth();
  const [authorize, setAuthorize] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeToken) return;
    setLoading(true);
    const client = getDerivClient();
    client
      .authorize(activeToken)
      .then((res) => setAuthorize(res.authorize))
      .finally(() => setLoading(false));
  }, [activeToken]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account info, connection details and session management.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-sm font-semibold">Account</h2>
          {loading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : authorize ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Row label="Full name" value={authorize.fullname} />
              <Row label="Email" value={authorize.email} />
              <Row label="Login ID" value={authorize.loginid} mono />
              <Row label="Country" value={authorize.country?.toUpperCase()} />
              <Row label="Currency" value={authorize.currency} />
              <Row label="Account type" value={authorize.account_category} />
              <Row label="Landing company" value={authorize.landing_company_fullname} />
              <Row label="User ID" value={String(authorize.user_id ?? "")} mono />
            </dl>
          ) : (
            <div className="text-sm text-muted-foreground">No data.</div>
          )}
        </Card>

        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-sm font-semibold">Connected accounts</h2>
          <div className="space-y-2">
            {session?.accounts.map((a) => {
              const isActive = a.account === session.activeAccount;
              return (
                <div
                  key={a.account}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                >
                  <div>
                    <div className="font-mono text-sm">{a.account}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.currency ?? "—"}
                    </div>
                  </div>
                  {isActive ? (
                    <Badge variant="outline" className="border-success/50 text-success">
                      Active
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => switchAccount(a.account)}>
                      Switch
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-sm font-semibold">Connection</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Row label="App ID" value={DERIV_APP_ID} mono />
            <Row label="WebSocket" value="wss://ws.derivws.com/websockets/v3" mono />
            <Row label="Scopes" value={(authorize?.scopes ?? []).join(", ") || "—"} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            Tokens are stored locally in your browser only. Logging out clears them.
          </p>
        </Card>

        <Card className="flex items-center justify-between border-destructive/30 bg-destructive/5 p-5">
          <div>
            <h2 className="text-sm font-semibold">Sign out</h2>
            <p className="text-xs text-muted-foreground">
              Clears your session from this browser.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={logout}>
            <LogOut className="mr-1.5 h-4 w-4" /> Logout
          </Button>
        </Card>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background/30 p-2.5">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>{value || "—"}</dd>
    </div>
  );
}
