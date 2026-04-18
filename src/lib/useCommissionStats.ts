// useCommissionStats — fetches the user's apps + app_markup_statistics across
// multiple periods (today, yesterday, this month, last month, custom range)
// and exposes deltas (% change) for comparison cards.
//
// Deriv API references:
//   - app_list                 : returns the apps owned by the authorized user
//   - app_markup_statistics    : per-app commission/markup totals over a date range
//     Response shape: {
//       app_markup_statistics: {
//         total_app_markup_usd, total_transactions_count,
//         breakdown: [{ app_id, app_markup_usd, app_markup_value,
//                       dev_currcode, transactions_count }, ...]
//       }
//     }
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDerivClient } from "@/lib/deriv";

export type AppInfo = {
  app_id: number;
  name: string;
  redirect_uri?: string;
  scopes?: string[];
  active?: number;
};

export type AppBreakdownRow = {
  app_id: number;
  app_markup_usd: number;
  app_markup_value: number;
  dev_currcode: string;
  transactions_count: number;
};

export type PeriodStats = {
  total_app_markup_usd: number;
  total_transactions_count: number;
  breakdown: AppBreakdownRow[];
};

export type CommissionData = {
  apps: AppInfo[];
  today: PeriodStats;
  yesterday: PeriodStats;
  thisMonth: PeriodStats;
  lastMonth: PeriodStats;
  range: PeriodStats;
  rangeFrom: string;
  rangeTo: string;
};

const EMPTY: PeriodStats = {
  total_app_markup_usd: 0,
  total_transactions_count: 0,
  breakdown: [],
};

// Deriv expects YYYY-MM-DD HH:mm:ss in UTC.
function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function endOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
}

export function getPeriodRanges() {
  const now = new Date();
  const today = startOfDayUTC(now);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);

  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));

  return {
    today: { from: fmt(today), to: fmt(endOfDayUTC(now)) },
    yesterday: { from: fmt(yesterday), to: fmt(endOfDayUTC(yesterday)) },
    thisMonth: { from: fmt(thisMonthStart), to: fmt(endOfDayUTC(now)) },
    lastMonth: { from: fmt(lastMonthStart), to: fmt(lastMonthEnd) },
  };
}

function normalizeStats(raw: any): PeriodStats {
  const root = raw?.app_markup_statistics ?? raw;
  if (!root) return { ...EMPTY };
  return {
    total_app_markup_usd: Number(root.total_app_markup_usd ?? 0),
    total_transactions_count: Number(root.total_transactions_count ?? 0),
    breakdown: Array.isArray(root.breakdown)
      ? root.breakdown.map((b: any) => ({
          app_id: Number(b.app_id),
          app_markup_usd: Number(b.app_markup_usd ?? 0),
          app_markup_value: Number(b.app_markup_value ?? 0),
          dev_currcode: String(b.dev_currcode ?? "USD"),
          transactions_count: Number(b.transactions_count ?? 0),
        }))
      : [],
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function useCommissionStats(
  token: string | null,
  customRange: { from: Date; to: Date },
) {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customKey = `${customRange.from.toISOString()}|${customRange.to.toISOString()}`;

  const fetchAll = useCallback(
    async (tok: string) => {
      const client = getDerivClient();
      setLoading(true);
      setError(null);
      try {
        await client.authorize(tok);

        // 1) Apps owned by the user.
        const appsRes = await client.appList().catch(() => null);
        const apps: AppInfo[] = (appsRes?.app_list ?? []).map((a: any) => ({
          app_id: Number(a.app_id),
          name: String(a.name ?? `App ${a.app_id}`),
          redirect_uri: a.redirect_uri,
          scopes: a.scopes,
          active: a.active,
        }));

        const r = getPeriodRanges();
        const rangeFrom = fmt(startOfDayUTC(customRange.from));
        const rangeTo = fmt(endOfDayUTC(customRange.to));

        // 2) Commission stats for each period (parallel).
        const [today, yesterday, thisMonth, lastMonth, range] = await Promise.all([
          client.appMarkupStatistics(r.today.from, r.today.to).catch(() => null),
          client.appMarkupStatistics(r.yesterday.from, r.yesterday.to).catch(() => null),
          client.appMarkupStatistics(r.thisMonth.from, r.thisMonth.to).catch(() => null),
          client.appMarkupStatistics(r.lastMonth.from, r.lastMonth.to).catch(() => null),
          client.appMarkupStatistics(rangeFrom, rangeTo).catch(() => null),
        ]);

        setData({
          apps,
          today: normalizeStats(today),
          yesterday: normalizeStats(yesterday),
          thisMonth: normalizeStats(thisMonth),
          lastMonth: normalizeStats(lastMonth),
          range: normalizeStats(range),
          rangeFrom,
          rangeTo,
        });
      } catch (e: any) {
        setError(e?.message ?? "Failed to load commission stats");
      } finally {
        setLoading(false);
      }
    },
    [customRange.from, customRange.to],
  );

  useEffect(() => {
    if (!token) {
      setData(null);
      return;
    }
    void fetchAll(token);
    // re-run when token or custom range changes
  }, [token, customKey, fetchAll]);

  const refresh = useCallback(() => {
    if (token) void fetchAll(token);
  }, [token, fetchAll]);

  // Derived totals
  const totals = useMemo(() => {
    if (!data) return null;
    const uniqueApps = new Set<number>();
    data.thisMonth.breakdown.forEach((b) => uniqueApps.add(b.app_id));
    data.lastMonth.breakdown.forEach((b) => uniqueApps.add(b.app_id));
    return {
      activeApps: uniqueApps.size || data.apps.length,
      totalApps: data.apps.length,
    };
  }, [data]);

  return { data, loading, error, refresh, totals };
}
