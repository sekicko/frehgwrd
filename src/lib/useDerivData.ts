// useDerivData — connects, authorizes, then fetches live profit_table & statement.
// Derives commission stats from real transactions (no demo data).
import { useCallback, useEffect, useRef, useState } from "react";
import { getDerivClient, type ConnectionStatus } from "@/lib/deriv";

export type ProfitRow = {
  transaction_id: number;
  contract_id?: number;
  buy_price: number;
  sell_price: number;
  payout?: number;
  shortcode?: string;
  longcode?: string;
  purchase_time?: number;
  sell_time?: number;
  app_id?: number;
};

export type StatementRow = {
  transaction_id: number;
  reference_id?: number;
  amount: number;
  balance_after?: number;
  action_type: string;
  transaction_time: number;
  longcode?: string;
  app_id?: number;
};

export type DashboardData = {
  authorize: any | null;
  balance: { balance: number; currency: string } | null;
  profitTable: ProfitRow[];
  statement: StatementRow[];
  affiliate: any | null; // may be null if account has no affiliate program
  affiliateError: string | null;
};

export function useDerivData(token: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string | undefined>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Subscribe to connection status.
  useEffect(() => {
    const client = getDerivClient();
    const unsub = client.onStatus((s, d) => {
      setStatus(s);
      setStatusDetail(d);
    });
    return () => {
      unsub();
    };
  }, []);

  const fetchAll = useCallback(async (tok: string) => {
    const client = getDerivClient();
    setLoading(true);
    setError(null);
    try {
      const authorize = await client.authorize(tok);

      const [balanceRes, profit, stmt] = await Promise.all([
        client.balance().catch(() => null),
        client.profitTable(500, 0).catch(() => null),
        client.statement(500, 0).catch(() => null),
      ]);

      // Affiliate stats are optional — only some accounts have access.
      let affiliate: any | null = null;
      let affiliateError: string | null = null;
      try {
        const aff = await client.affiliateStatistics();
        affiliate = aff?.affiliate_account_statistics ?? aff;
      } catch (e: any) {
        affiliateError = e?.message ?? "Affiliate stats unavailable for this account";
      }

      setData({
        authorize: authorize.authorize ?? authorize,
        balance: balanceRes?.balance
          ? { balance: balanceRes.balance.balance, currency: balanceRes.balance.currency }
          : null,
        profitTable: profit?.profit_table?.transactions ?? [],
        statement: stmt?.statement?.transactions ?? [],
        affiliate,
        affiliateError,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load Deriv data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when token changes.
  useEffect(() => {
    if (!token) {
      setData(null);
      return;
    }
    if (tokenRef.current === token && data) return;
    tokenRef.current = token;
    void fetchAll(token);
  }, [token, fetchAll, data]);

  const refresh = useCallback(() => {
    if (token) void fetchAll(token);
  }, [token, fetchAll]);

  return { status, statusDetail, data, loading, error, refresh };
}
