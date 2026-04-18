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

  appMarkupStatistics(dateFrom: string, dateTo: string, appIds?: number[]) {
    const payload: Record<string, any> = {
      app_markup_statistics: 1,
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (appIds && appIds.length) payload.app_id = appIds;
    return this.send(payload);
  }

  // List all apps registered by the authenticated user.
  appList() {
    return this.send({ app_list: 1 });
  }

  appGet(appId: number) {
    return this.send({ app_get: appId });
  }

  appDelete(appId: number) {
    return this.send({ app_delete: appId });
  }

  appMarkupDetails(appId: number, dateFrom: string, dateTo: string) {
    return this.send({
      app_markup_details: 1,
      app_id: appId,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

  // Register a new app. See: https://api.deriv.com/api-explorer#app_register
  appRegister(payload: AppRegisterPayload) {
    return this.send({ app_register: 1, ...payload });
  }

  // Update an existing app. Same fields as register + app_update id.
  appUpdate(appId: number, payload: AppRegisterPayload) {
    return this.send({ app_update: appId, ...payload });
  }

  // ---- API Tokens ----
  apiTokenList() {
    return this.send({ api_token: 1 });
  }

  apiTokenCreate(name: string, scopes: ApiTokenScope[], validForCurrentIpOnly = false) {
    return this.send({
      api_token: 1,
      new_token: name,
      new_token_scopes: scopes,
      valid_for_current_ip_only: validForCurrentIpOnly ? 1 : 0,
    });
  }

  apiTokenDelete(token: string) {
    return this.send({ api_token: 1, delete_token: token });
  }
}

export type ApiTokenScope = "read" | "trade" | "trading_information" | "payments" | "admin";

export const ALL_TOKEN_SCOPES: { value: ApiTokenScope; label: string; description: string }[] = [
  { value: "read", label: "Read", description: "View account activity, settings, balances." },
  { value: "trade", label: "Trade", description: "Buy and sell contracts, manage positions." },
  { value: "trading_information", label: "Trading info", description: "View trading history." },
  { value: "payments", label: "Payments", description: "Withdraw, deposit, transfer between accounts." },
  { value: "admin", label: "Admin", description: "Full access including managing tokens & apps." },
];

// Deriv app_register payload — mirrors the official API spec.
// Docs: https://api.deriv.com/api-explorer#app_register
export type AppRegisterPayload = {
  name: string;
  scopes: ApiTokenScope[];
  redirect_uri?: string;
  verification_uri?: string;
  homepage?: string;
  github?: string;
  appstore?: string;
  googleplay?: string;
  app_markup_percentage?: number; // 0 - 5
};

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
