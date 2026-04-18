import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDerivClient, type AppRegisterPayload } from "@/lib/deriv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AppWindow,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AppFormDialog, type AppFormInitial } from "@/components/dashboard/AppFormDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/apps")({
  component: AppsPage,
});

type DerivApp = {
  app_id: number;
  name: string;
  redirect_uri?: string;
  verification_uri?: string;
  homepage?: string;
  github?: string;
  appstore?: string;
  googleplay?: string;
  app_markup_percentage?: number;
  scopes?: string[];
  active?: number;
};

function AppsPage() {
  const { activeToken } = useAuth();
  const [apps, setApps] = useState<DerivApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingApp, setEditingApp] = useState<AppFormInitial | undefined>();

  const load = useCallback(async () => {
    if (!activeToken) return;
    setLoading(true);
    setError(null);
    try {
      const client = getDerivClient();
      await client.authorize(activeToken);
      const res = await client.appList();
      setApps((res.app_list ?? []) as DerivApp[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }, [activeToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = () => {
    setDialogMode("create");
    setEditingApp(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (app: DerivApp) => {
    setDialogMode("edit");
    setEditingApp({
      app_id: app.app_id,
      name: app.name,
      redirect_uri: app.redirect_uri,
      verification_uri: app.verification_uri,
      homepage: app.homepage,
      github: app.github,
      appstore: app.appstore,
      googleplay: app.googleplay,
      app_markup_percentage: app.app_markup_percentage,
      scopes: (app.scopes as AppFormInitial["scopes"]) ?? ["read"],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: AppRegisterPayload) => {
    const client = getDerivClient();
    await client.authorize(activeToken!);
    if (dialogMode === "create") {
      const res = await client.appRegister(payload);
      toast.success(`App registered — ID ${res.app_register?.app_id ?? ""}`);
    } else if (editingApp?.app_id) {
      await client.appUpdate(editingApp.app_id, payload);
      toast.success("App updated");
    }
    await load();
  };

  const handleDelete = async (app: DerivApp) => {
    if (!confirm(`Delete app "${app.name}" (ID ${app.app_id})? This cannot be undone.`)) return;
    try {
      const client = getDerivClient();
      await client.authorize(activeToken!);
      await client.appDelete(app.app_id);
      toast.success("App deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Apps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apps registered against your Deriv account. Each app has its own{" "}
            <span className="font-mono">app_id</span> used for OAuth and markup commission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New app
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 flex items-start gap-3 border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="text-sm">
            <div className="font-medium text-destructive">Failed to load apps</div>
            <div className="mt-0.5 text-destructive/80">{error}</div>
            <div className="mt-1 text-xs text-destructive/70">
              Note: app management requires an admin-scoped token.
            </div>
          </div>
        </Card>
      )}

      {loading && !apps.length ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading apps…
        </div>
      ) : apps.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <AppWindow className="h-10 w-10 text-muted-foreground" />
          <div>
            <div className="font-medium">No apps registered yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Register your first app to start earning affiliate commission.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Register new app
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {apps.map((app) => (
            <Card key={app.app_id} className="border-border/60 bg-[image:var(--gradient-card)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{app.name}</h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      ID {app.app_id}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Markup: {app.app_markup_percentage ?? 0}%
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(app)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(app)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                {app.redirect_uri && (
                  <Row label="Redirect" value={app.redirect_uri} link />
                )}
                {app.homepage && <Row label="Homepage" value={app.homepage} link />}
                {app.verification_uri && (
                  <Row label="Verify" value={app.verification_uri} link />
                )}
              </div>

              {app.scopes?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {app.scopes.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <AppFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editingApp}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 items-center gap-1 truncate text-foreground hover:underline"
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
        </a>
      ) : (
        <span className="truncate text-foreground">{value}</span>
      )}
    </div>
  );
}
