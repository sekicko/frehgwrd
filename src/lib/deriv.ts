// Deriv WebSocket client.
// Docs: https://api.deriv.com  •  Endpoint: wss://ws.derivws.com/websockets/v3?app_id=<APP_ID>
//
// Flow:
//   1. open ws  →  send { authorize: <token> }
//   2. correlate every send with a unique req_id and resolve the matching response
//   3. expose typed helpers (authorize, profitTable, statement, affiliateStatistics, ...)
//
// The token is obtained either from Deriv OAuth (?token1=... in callback URL)
// or from a manual API token created at app.deriv.com/account/api-token.

export const DERIV_APP_ID =
  (import.meta.env.VITE_DERIV_APP_ID as string | undefined) ?? "133222";

export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

export type ConnectionStatus = "idle" | "connecting" | "open" | "authorized" | "closed" | "error";

type Pending = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class DerivClient {
  private ws: WebSocket | null = null;
  private reqId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<(s: ConnectionStatus, detail?: string) => void>();
  private status: ConnectionStatus = "idle";
  private token: string | null = null;
  private authorizePromise: Promise<any> | null = null;

  onStatus(cb: (s: ConnectionStatus, detail?: string) => void) {
    this.listeners.add(cb);
    cb(this.status);
    return () => this.listeners.delete(cb);
  }

  private setStatus(s: ConnectionStatus, detail?: string) {
    this.status = s;
    this.listeners.forEach((l) => l(s, detail));
  }

  getStatus() {
    return this.status;
  }

  connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    this.setStatus("connecting");
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(DERIV_WS_URL);
        this.ws = ws;
        ws.onopen = () => {
          this.setStatus("open");
          resolve();
        };
        ws.onerror = (e) => {
          this.setStatus("error", "WebSocket error");
          reject(e);
        };
        ws.onclose = () => {
          this.setStatus("closed");
          this.ws = null;
          this.authorizePromise = null;
          // reject any pending
          this.pending.forEach((p) => {
            clearTimeout(p.timer);
            p.reject(new Error("Connection closed"));
          });
          this.pending.clear();
        };
        ws.onmessage = (msg) => this.handleMessage(msg.data);
      } catch (e) {
        this.setStatus("error", String(e));
        reject(e);
      }
    });
  }

  private handleMessage(raw: string) {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const reqId: number | undefined = data.req_id;
    if (reqId && this.pending.has(reqId)) {
      const p = this.pending.get(reqId)!;
      clearTimeout(p.timer);
      this.pending.delete(reqId);
      if (data.error) p.reject(new Error(data.error.message ?? "Deriv API error"));
      else p.resolve(data);
    }
  }

  send<T = any>(payload: Record<string, any>, timeoutMs = 20000): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket not open"));
    }
    const req_id = this.reqId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(req_id);
        reject(new Error("Request timed out"));
      }, timeoutMs);
      this.pending.set(req_id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify({ ...payload, req_id }));
    });
  }

  async authorize(token: string) {
    this.token = token;
    await this.connect();
    if (this.authorizePromise) return this.authorizePromise;
    this.authorizePromise = this.send({ authorize: token }).then((res) => {
      this.setStatus("authorized");
      return res;
    });
    try {
      return await this.authorizePromise;
    } catch (e) {
      this.authorizePromise = null;
      throw e;
    }
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
    }
    this.ws = null;
    this.token = null;
    this.authorizePromise = null;
    this.setStatus("idle");
  }

  // ---- Typed helpers ----------------------------------------------------

  profitTable(limit = 50, offset = 0) {
    return this.send({
      profit_table: 1,
      description: 1,
      limit,
      offset,
      sort: "DESC",
    });
  }

  statement(limit = 50, offset = 0) {
    return this.send({
      statement: 1,
      description: 1,
      limit,
      offset,
    });
  }

  balance() {
    return this.send({ balance: 1 });
  }

  getAccountStatus() {
    return this.send({ get_account_status: 1 });
  }

  // Affiliate-specific: only works on accounts with affiliate program enabled.
  affiliateStatistics(dateFrom?: string, dateTo?: string) {
    const payload: Record<string, any> = { affiliate_account_statistics: 1 };
    if (dateFrom) payload.date_from = dateFrom;
    if (dateTo) payload.date_to = dateTo;
    return this.send(payload);
  }

  appMarkupStatistics(dateFrom: string, dateTo: string) {
    return this.send({
      app_markup_statistics: 1,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }
}

// Singleton — one connection per browser tab.
let _client: DerivClient | null = null;
export function getDerivClient(): DerivClient {
  if (typeof window === "undefined") {
    // SSR safety: never construct on the server.
    throw new Error("DerivClient is browser-only");
  }
  if (!_client) _client = new DerivClient();
  return _client;
}

// ---- OAuth ----
export function buildOAuthUrl(redirectUri: string) {
  // Deriv OAuth: redirects back with ?acct1=...&token1=...&cur1=... (and acct2/token2 if multi)
  const url = new URL("https://oauth.deriv.com/oauth2/authorize");
  url.searchParams.set("app_id", DERIV_APP_ID);
  url.searchParams.set("l", "EN");
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export type DerivAccount = {
  account: string; // e.g. CR1234
  token: string;
  currency?: string;
};

export function parseOAuthAccounts(search: string): DerivAccount[] {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const accounts: DerivAccount[] = [];
  for (let i = 1; i < 20; i++) {
    const account = params.get(`acct${i}`);
    const token = params.get(`token${i}`);
    if (!account || !token) break;
    accounts.push({
      account,
      token,
      currency: params.get(`cur${i}`) ?? undefined,
    });
  }
  return accounts;
}
