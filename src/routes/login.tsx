import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { buildOAuthUrl, DERIV_APP_ID } from "@/lib/deriv";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Deriv Affiliate Dashboard" },
      {
        name: "description",
        content:
          "Sign in with your Deriv account via OAuth or paste an API token to view your live affiliate dashboard.",
      },
      { property: "og:title", content: "Login — Deriv Affiliate Dashboard" },
      {
        property: "og:description",
        content: "Authenticate with Deriv to access your live commission analytics.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/auth/callback`);
  }, []);

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const handleOAuth = () => {
    window.location.href = buildOAuthUrl(redirectUri);
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    loginWithToken(token.trim());
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,_oklch(0.78_0.18_145_/_0.18),_transparent_60%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Deriv Affiliate</span>
        </Link>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* OAuth */}
          <Card className="flex flex-col justify-between border-border/60 bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-card)]">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Sign in with Deriv</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure OAuth flow. You&apos;ll be redirected to Deriv to authorize app{" "}
                <span className="font-mono text-foreground">{DERIV_APP_ID}</span>, then sent back
                here with a real access token.
              </p>
            </div>
            <Button
              onClick={handleOAuth}
              variant="hero"
              size="lg"
              className="mt-6"
              disabled={!redirectUri}
            >
              Continue with Deriv
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          {/* Manual token */}
          <Card className="flex flex-col border-border/60 bg-card/60 p-6 shadow-[var(--shadow-card)]">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">Use an API token</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create one at{" "}
              <a
                href="https://app.deriv.com/account/api-token"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                app.deriv.com/account/api-token
              </a>{" "}
              with <em>Read</em> scope.
            </p>
            <form onSubmit={handleManual} className="mt-5 flex flex-1 flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs">
                  API token
                </Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="a1b2C3d4E5..."
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                />
              </div>
              <div className="mt-auto">
                <Button type="submit" disabled={!token.trim()} className="w-full">
                  Connect
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <p className="mt-8 max-w-md text-center text-xs text-muted-foreground">
          We never send your token to any server other than Deriv&apos;s WebSocket API
          (<span className="font-mono">wss://ws.derivws.com</span>). Sessions are stored locally in
          your browser.
        </p>
      </div>
    </div>
  );
}
