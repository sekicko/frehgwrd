// Deriv app_register / app_update modal.
// Mirrors the official Deriv field set so admins can create real app IDs
// directly from the dashboard. Docs: https://api.deriv.com/api-explorer#app_register
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  ALL_TOKEN_SCOPES,
  type AppRegisterPayload,
  type ApiTokenScope,
} from "@/lib/deriv";

export type AppFormInitial = Partial<AppRegisterPayload> & { app_id?: number };

export function AppFormDialog({
  open,
  onOpenChange,
  initial,
  mode,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AppFormInitial;
  mode: "create" | "edit";
  onSubmit: (payload: AppRegisterPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState("");
  const [verification, setVerification] = useState("");
  const [homepage, setHomepage] = useState("");
  const [github, setGithub] = useState("");
  const [appstore, setAppstore] = useState("");
  const [googleplay, setGoogleplay] = useState("");
  const [markup, setMarkup] = useState<string>("0");
  const [scopes, setScopes] = useState<ApiTokenScope[]>(["read"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setRedirect(initial?.redirect_uri ?? "");
    setVerification(initial?.verification_uri ?? "");
    setHomepage(initial?.homepage ?? "");
    setGithub(initial?.github ?? "");
    setAppstore(initial?.appstore ?? "");
    setGoogleplay(initial?.googleplay ?? "");
    setMarkup(String(initial?.app_markup_percentage ?? 0));
    setScopes(initial?.scopes?.length ? initial.scopes : ["read"]);
    setError(null);
  }, [open, initial]);

  const toggleScope = (s: ApiTokenScope) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("App name is required.");
    if (!scopes.length) return setError("Select at least one scope.");
    const markupNum = Number(markup);
    if (Number.isNaN(markupNum) || markupNum < 0 || markupNum > 5) {
      return setError("Markup percentage must be between 0 and 5.");
    }
    const payload: AppRegisterPayload = {
      name: name.trim(),
      scopes,
      app_markup_percentage: markupNum,
    };
    if (redirect.trim()) payload.redirect_uri = redirect.trim();
    if (verification.trim()) payload.verification_uri = verification.trim();
    if (homepage.trim()) payload.homepage = homepage.trim();
    if (github.trim()) payload.github = github.trim();
    if (appstore.trim()) payload.appstore = appstore.trim();
    if (googleplay.trim()) payload.googleplay = googleplay.trim();

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Register new app" : "Update app"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Register a new application with Deriv. The returned app_id can be used to authorize OAuth flows and earn markup commission."
              : "Edit the details of your existing Deriv application."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="app-name">
              App name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Trading App"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="redirect">OAuth redirect URI</Label>
              <Input
                id="redirect"
                value={redirect}
                onChange={(e) => setRedirect(e.target.value)}
                placeholder="https://yourapp.com/auth/callback"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verification">Verification URI</Label>
              <Input
                id="verification"
                value={verification}
                onChange={(e) => setVerification(e.target.value)}
                placeholder="https://yourapp.com/verify"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="homepage">Homepage URL</Label>
              <Input
                id="homepage"
                value={homepage}
                onChange={(e) => setHomepage(e.target.value)}
                placeholder="https://yourapp.com"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="markup">
                Markup percentage <span className="text-muted-foreground">(0–5%)</span>
              </Label>
              <Input
                id="markup"
                type="number"
                min={0}
                max={5}
                step={0.01}
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/org/repo"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appstore">App Store</Label>
              <Input
                id="appstore"
                value={appstore}
                onChange={(e) => setAppstore(e.target.value)}
                placeholder="https://apps.apple.com/..."
                type="url"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="googleplay">Google Play</Label>
              <Input
                id="googleplay"
                value={googleplay}
                onChange={(e) => setGoogleplay(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Scopes <span className="text-destructive">*</span>
            </Label>
            <div className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-2">
              {ALL_TOKEN_SCOPES.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/40"
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

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Register app" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
