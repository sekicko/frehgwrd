import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "accent" | "success" | "destructive";
};

const accentMap = {
  primary: "from-primary/20 to-transparent text-primary",
  accent: "from-accent/20 to-transparent text-accent",
  success: "from-success/20 to-transparent text-success",
  destructive: "from-destructive/20 to-transparent text-destructive",
};

export function StatCard({ label, value, hint, accent = "primary" }: Props) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-[image:var(--gradient-card)] p-5 shadow-[var(--shadow-card)]">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          accentMap[accent],
        )}
      />
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
