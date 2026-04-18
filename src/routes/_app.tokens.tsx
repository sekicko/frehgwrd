import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  ALL_TOKEN_SCOPES,
  getDerivClient,
  type ApiTokenScope,
} from "@/lib/deriv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/tokens")({
  component: TokensPage,
});

type Token = {
  display_name: string;
  token: string;
  scopes: ApiTokenScope[];
  last_used: string | null;
  valid_for_ip: string;
};

function TokensPage() {
  const { activeToken } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiTokenScope[]>(["read"]);
  const [ipBound, setIpBound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeToken) return;
    setLoading(true);
    setError(null);
    try {
      const client = getDerivClient();
      await client.authorize(activeToken);
      const res = await client.apiTokenList();
      setTokens((res.api_token?.tokens ?? []) as Token[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, [activeToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Token name is required");
    if (!scopes.length) return toast.error("Pick at least one scope");
    setSubmitting(true);
    try {
      const client = getDerivClient();
      await client.authorize(activeToken!);
      const res = await client.apiTokenCreate(name.trim(), scopes, ipBound);
      const newOne = (res.api_token?.tokens as Token[] | undefined)?.find(
        (t) => t.display_name === name.trim(),
      );
      setCreatedToken(newOne?.token ?? null);
      setName("");
      setScopes(["read"]);
      setIpBound(false);
      setOpen(false);
      await load();
      toast.success("Token created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (token: Token) => {
    if (!confirm(`Delete token "${token.display_name}"?`)) return;
    try {
      const client = getDerivClient();
      await client.authorize(activeToken!);
      await client.apiTokenDelete(token.token);
      toast.success("Token deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const copy = (val: string) => {
    void navigator.clipboard.writeText(val);
    toast.success("Copied to clipboard");
  };

  const toggleScope = (s: ApiTokenScope) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Tokens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate Deriv API tokens for your account. Pick the smallest scope set you need.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New token
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 flex items-start gap-3 border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="text-sm">
            <div className="font-medium text-destructive">Failed to load tokens</div>
            <div className="mt-0.5 text-destructive/80">{error}</div>
          </div>
        </Card>
      )}

      {createdToken && (
        <Card className="mb-6 border-success/40 bg-success/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">New token created</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Copy this now — Deriv only shows the value once on creation.
              </p>
              <code className="mt-2 block truncate rounded border border-border/60 bg-background/60 px-2 py-1.5 font-mono text-xs">
                {createdToken}
              </code>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="outline" onClick={() => copy(createdToken)}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatedToken(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && !tokens.length ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading tokens…
        </div>
      ) : tokens.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <KeyRound className="h-10 w-10 text-muted-foreground" />
          <div>
            <div className="font-medium">No API tokens yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate one to authenticate from scripts, bots or other tools.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create token
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <Card
              key={t.token}
              className="flex flex-wrap items-center justify-between gap-4 border-border/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t.display_name}</span>
                  {t.scopes?.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {t.valid_for_ip && (
                    <Badge variant="outline" className="text-[10px]">
                      IP: {t.valid_for_ip}
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="truncate rounded border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-xs">
                    {t.token}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copy(t.token)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Last used: {t.last_used ?? "never"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(t)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API token</DialogTitle>
            <DialogDescription>
              Give the token a friendly name and select the scopes it should be allowed to use.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="token-name">Name</Label>
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My script token"
                maxLength={32}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="space-y-1.5 rounded-md border border-border/60 p-3">
                {ALL_TOKEN_SCOPES.map((s) => (
                  <label
                    key={s.value}
                    className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={scopes.includes(s.value)}
                      onCheckedChange={() => toggleScope(s.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={ipBound} onCheckedChange={(v) => setIpBound(v === true)} />
              Restrict to my current IP address
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create token
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
