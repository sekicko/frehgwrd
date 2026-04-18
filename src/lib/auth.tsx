// Lightweight auth provider. Sessions live in localStorage so the user
// stays logged in across reloads. Two ways to log in:
//   1. Deriv OAuth (recommended)  →  /auth/callback parses ?token1=...
//   2. Manual API token from app.deriv.com/account/api-token
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DerivAccount } from "./deriv";

const STORAGE_KEY = "deriv.session.v1";

export type Session = {
  accounts: DerivAccount[];
  activeAccount: string; // account id (e.g. CR1234)
  loginAt: number;
};

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  activeToken: string | null;
  loginWithAccounts: (accounts: DerivAccount[]) => void;
  loginWithToken: (token: string) => void;
  switchAccount: (account: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accounts?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  // Hydrate after mount to avoid SSR/CSR mismatch.
  useEffect(() => {
    setSession(readSession());
  }, []);

  const loginWithAccounts = useCallback((accounts: DerivAccount[]) => {
    if (!accounts.length) return;
    const s: Session = {
      accounts,
      activeAccount: accounts[0].account,
      loginAt: Date.now(),
    };
    writeSession(s);
    setSession(s);
  }, []);

  const loginWithToken = useCallback((token: string) => {
    const accounts: DerivAccount[] = [{ account: "manual", token }];
    const s: Session = { accounts, activeAccount: "manual", loginAt: Date.now() };
    writeSession(s);
    setSession(s);
  }, []);

  const switchAccount = useCallback((account: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, activeAccount: account };
      writeSession(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const activeToken =
      session?.accounts.find((a) => a.account === session.activeAccount)?.token ?? null;
    return {
      session,
      isAuthenticated: !!session && !!activeToken,
      activeToken,
      loginWithAccounts,
      loginWithToken,
      switchAccount,
      logout,
    };
  }, [session, loginWithAccounts, loginWithToken, switchAccount, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
