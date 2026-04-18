import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { parseOAuthAccounts } from "@/lib/deriv";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Authorizing — Deriv Affiliate Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const { loginWithAccounts } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deriv OAuth returns ?acct1=...&token1=...&cur1=... in the query string.
    const accounts = parseOAuthAccounts(window.location.search);
    if (accounts.length === 0) {
      setError(
        "No Deriv accounts returned. The OAuth callback is missing token parameters — check that app ID 133222 has this URL whitelisted as a redirect URI.",
      );
      return;
    }
    loginWithAccounts(accounts);
    // Clean the URL and go to dashboard.
    void navigate({ to: "/", replace: true });
  }, [loginWithAccounts, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold">Login failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
              Back to login
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Authorizing with Deriv…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
