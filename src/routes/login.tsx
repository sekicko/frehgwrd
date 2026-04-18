import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { buildOAuthUrl } from "@/lib/deriv";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  ExternalLink,
  Globe,
  KeyRound,
  LineChart,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Deriv Affiliate Dashboard — Live commissions, apps & API tokens" },
      {
        name: "description",
        content:
          "Real-time Deriv affiliate analytics. Track commissions, manage app IDs, generate API tokens, and build third-party integrations on top of the Deriv API.",
      },
      {
        property: "og:title",
        content: "Deriv Affiliate Dashboard — Live commissions, apps & API tokens",
      },
      {
        property: "og:description",
        content:
          "Authenticate with Deriv to access live commission analytics, app management and API tooling.",
      },
    ],
  }),
  component: LoginPage,
});

const FEATURES = [
  {
    icon: LineChart,
    title: "Live commission analytics",
    body: "Today vs yesterday, this month vs last month, custom date ranges — all powered by the official app_markup_statistics endpoint.",
  },
  {
    icon: Boxes,
    title: "Manage your Deriv apps",
    body: "Register, update and delete app IDs from inside the dashboard. Set redirect URIs, scopes and markup commission per app.",
  },
  {
    icon: KeyRound,
    title: "Generate API tokens",
    body: "Create scoped API tokens (read, trade, payments, admin) with optional IP binding — directly from your account.",
  },
  {
    icon: Wallet,
    title: "Per-app earnings breakdown",
    body: "See transactions, unique clients and commission per app_id so you know exactly which integration is performing.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Sign in with Deriv",
    body: "Use OAuth or paste a Read-scope API token. Sessions stay in your browser — nothing is sent to our servers.",
  },
  {
    n: "02",
    title: "We connect to wss://ws.derivws.com",
    body: "A WebSocket session authorizes against the official Deriv API using app_id 133222.",
  },
  {
    n: "03",
    title: "Build & track",
    body: "Register new app IDs, mint tokens, and watch commission flow in real time.",
  },
] as const;

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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,_oklch(0.82_0.16_215_/_0.20),_transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_oklch(0.7_0.18_265_/_0.18),_transparent_70%)]"
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/login" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] sm:h-9 sm:w-9">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-primary sm:text-base">
            AppDeriv
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
          <a
            href="https://api.deriv.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            API docs
          </a>
          <a
            href="https://app.deriv.com/account/api-token"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <KeyRound className="h-4 w-4" />
            Get a token
          </a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        {/* Hero */}
        <section className="grid gap-6 pt-4 sm:gap-10 sm:pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground sm:gap-2 sm:px-3 sm:text-xs">
              <Sparkles className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
              Powered by the official Deriv API
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
              The control room for your{" "}
              <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                Deriv affiliate
              </span>{" "}
              business.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
              Track real commissions, register and manage your apps, generate API tokens, and ship
              third-party trading apps on top of Deriv — all from one authenticated dashboard.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-3">
              <Button onClick={handleOAuth} variant="hero" size="lg" disabled={!redirectUri}>
                Sign in with Deriv
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="https://api.deriv.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium transition-colors hover:bg-card sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                API docs
                <ExternalLink className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
              </a>
              <a
                href="https://appderiv.site"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium transition-colors hover:bg-card sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                appderiv.site
                <ExternalLink className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground sm:mt-6 sm:text-xs">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Secure OAuth sign-in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                100% real API data — no demo
              </span>
            </div>
          </div>

          {/* Auth card */}
          <Card className="border-border/60 bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary sm:h-9 sm:w-9">
                <ShieldCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold sm:text-base">Connect your account</h2>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  OAuth or API token — your choice.
                </p>
              </div>
            </div>

            <Button
              onClick={handleOAuth}
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!redirectUri}
            >
              Continue with Deriv
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>

            <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground sm:my-5 sm:text-[11px]">
              <div className="h-px flex-1 bg-border/60" />
              or paste a token
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <form onSubmit={handleManual} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs">
                  API token (Read scope minimum)
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
              <Button type="submit" disabled={!token.trim()} className="w-full">
                Connect with token
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Create one at{" "}
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  app.deriv.com/account/api-token
                </a>
                .
              </p>
            </form>
          </Card>
        </section>

        {/* Features */}
        <section className="mt-12 sm:mt-20">
          <div className="mb-5 max-w-2xl sm:mb-8">
            <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
              Everything an affiliate or app builder needs.
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
              One dashboard for live commissions, app management, and API tooling — straight from
              the Deriv API.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 bg-card/60 p-3 transition-colors hover:bg-card sm:p-5"
              >
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary transition-transform group-hover:scale-105 sm:mb-3 sm:h-10 sm:w-10 sm:rounded-lg">
                  <f.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-xs font-semibold sm:text-sm">{f.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-xs">
                  {f.body}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-3xl">How it works</h2>
            <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
              No middlemen, no proxies. Your browser talks directly to Deriv over a secure
              WebSocket. We never see your tokens or trades.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:gap-3">
              <a
                href="https://api.deriv.com/api-explorer"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-xs transition-colors hover:bg-card sm:px-4 sm:py-3 sm:text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Deriv API explorer
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
              </a>
              <a
                href="https://appderiv.site"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-xs transition-colors hover:bg-card sm:px-4 sm:py-3 sm:text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  appderiv.site — third-party app builders
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {STEPS.map((s) => (
              <Card
                key={s.n}
                className="flex gap-3 border-border/60 bg-card/60 p-3 shadow-[var(--shadow-card)] sm:gap-4 sm:p-5"
              >
                <div className="font-mono text-base font-semibold text-primary sm:text-xl">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xs font-semibold sm:text-sm">{s.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground sm:mt-1 sm:text-xs">
                    {s.body}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <p className="mx-auto mt-10 max-w-md text-center text-[11px] text-muted-foreground sm:mt-16 sm:text-xs">
          We never send your token to any server other than Deriv&apos;s WebSocket API
          (<span className="font-mono">wss://ws.derivws.com</span>). Sessions are stored locally in
          your browser.
        </p>
      </main>
    </div>
  );
}
