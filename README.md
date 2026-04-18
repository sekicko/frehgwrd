# Deriv Affiliate Dashboard

A live dashboard for Deriv affiliates. After authenticating with a real Deriv
account, the app connects directly to the Deriv WebSocket API and renders your
actual commission, trade, and client data — no demo or placeholder values.

## Stack

- **TanStack Start** (React 19 + Vite) with file-based routing
- **TypeScript**, **Tailwind CSS v4**
- **Recharts** for live charts
- Server-capable via TanStack Start server functions / file routes (used here only as needed; auth is fully client-side because Deriv OAuth returns the token directly in the redirect URL)

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_DERIV_APP_ID` | `133222` | Deriv application ID used for both OAuth and WebSocket connections. Override at build time if you register your own app. |

The corresponding redirect URI must be whitelisted on the app at
<https://app.deriv.com/account/api-token> → **Manage apps**. For this project
it is:

```
<your-origin>/auth/callback
```

## How auth works

There are two supported login paths:

### 1. Deriv OAuth (recommended)

1. User clicks **Continue with Deriv** on `/login`.
2. We redirect to `https://oauth.deriv.com/oauth2/authorize?app_id=<APP_ID>&redirect_uri=<origin>/auth/callback`.
3. Deriv authenticates the user and redirects back to `/auth/callback` with query parameters of the form:
   `?acct1=CR123&token1=a1b2...&cur1=USD&acct2=...`
4. `parseOAuthAccounts` (in `src/lib/deriv.ts`) extracts every `acctN`/`tokenN`/`curN` triple.
5. `AuthProvider` saves the session to `localStorage` (`deriv.session.v1`) so the user stays logged in across reloads.

> Note: Deriv does **not** expose a public email/password endpoint for third-party apps. OAuth is the official way for users to deliver an access token to your app.

### 2. Manual API token

For testing or for users who already have a token, paste a token created at
<https://app.deriv.com/account/api-token> (Read scope is sufficient for the
read-only calls this dashboard makes). The token is stored in `localStorage` the same way.

## How data loading works

Once a token is available:

1. `DerivClient.connect()` opens `wss://ws.derivws.com/websockets/v3?app_id=<APP_ID>`.
2. `authorize` is sent: `{ authorize: <token>, req_id: 1 }`. Deriv responds with the account profile.
3. The dashboard fires three live calls in parallel:
   - `balance` → current account balance
   - `profit_table` (limit 500) → real trade history
   - `statement` (limit 500) → ledger of all transactions
4. Optionally `affiliate_account_statistics` is requested. This call is only
   permitted on accounts with the affiliate program enabled; if it errors we
   show a graceful message and continue with the other live data.

Every WebSocket message is correlated by `req_id`, so multiple in-flight calls
work safely.

## Connection status

The status pill in the header reflects the live WebSocket state:

- `idle` — no connection
- `connecting` / `open` — handshake in progress
- `authorized` — `authorize` succeeded, ready for API calls
- `closed` / `error` — disconnected

Click **Refresh** to re-run all queries against the live API.

## Project structure

```
src/
  lib/
    deriv.ts         WebSocket client + OAuth helpers
    auth.tsx         AuthProvider + localStorage session
    useDerivData.ts  Hook that authorizes and fetches dashboard data
  components/dashboard/
    DashboardHeader.tsx
    StatCard.tsx
    CommissionChart.tsx
    ClientsTable.tsx
  routes/
    index.tsx        / (dashboard, redirects to /login if signed out)
    login.tsx        /login (OAuth or manual token)
    auth.callback.tsx  /auth/callback (parses OAuth response)
```

## Security notes

- Tokens never leave the browser except to Deriv's own WebSocket endpoint.
- Sessions are stored in `localStorage`. To force logout on every browser, switch to `sessionStorage` in `src/lib/auth.tsx`.
- For production, register your own Deriv app ID and set `VITE_DERIV_APP_ID` accordingly.
