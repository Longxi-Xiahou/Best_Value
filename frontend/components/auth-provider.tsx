"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type AuthUser = { id: string; name: string | null; email: string; role: string };
type AuthContextValue = { user: AuthUser | null; setUser: (user: AuthUser | null) => void };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Session loading will be added with the Phase 2 /auth/me endpoint.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
