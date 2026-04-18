import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pctChange } from "@/lib/useCommissionStats";

type Props = {
  label: string;
  current: number;
  previous: number;
  previousLabel: string;
  currency?: string;
  format?: "currency" | "number";
};

export function ComparisonCard({
  label,
  current,
  previous,
  previousLabel,
  currency = "USD",
  format = "currency",
}: Props) {
  const change = pctChange(current, previous);
  const direction =
    change === null ? "flat" : change > 0.05 ? "up" : change < -0.05 ? "down" : "flat";

  const fmt = (n: number) =>
    format === "currency"
      ? `${n.toFixed(2)} ${currency}`
      : n.toLocaleString();

  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  const tone =
    direction === "up"
      ? "text-success bg-success/10 border-success/30"
      : direction === "down"
        ? "text-destructive bg-destructive/10 border-destructive/30"
        : "text-muted-foreground bg-muted/40 border-border";

  return (
    <Card className="relative overflow-hidden border-border/60 bg-[image:var(--gradient-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{fmt(current)}</span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-medium",
            tone,
          )}
        >
          <Icon className="h-3 w-3" />
          {change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        vs {previousLabel}: <span className="tabular-nums text-foreground">{fmt(previous)}</span>
      </div>
    </Card>
  );
}
