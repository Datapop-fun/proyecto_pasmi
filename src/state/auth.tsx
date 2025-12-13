"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SESSION_KEY = "pasmi_session";

type AuthContextValue = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hidratar después del montaje para evitar mismatch SSR
  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    setIsLoggedIn(session === "active");
    setHydrated(true);
  }, []);

  const login = useCallback(() => {
    localStorage.setItem(SESSION_KEY, "active");
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn, login, logout, hydrated }),
    [isLoggedIn, login, logout, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
