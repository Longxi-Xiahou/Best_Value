"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiClientError, getCurrentUser, loginUser, logoutUser, registerUser, type AuthUser } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  register: (input: { email: string; password: string; firstName: string; lastName?: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch((requestError: unknown) => {
        if (active && (!(requestError instanceof ApiClientError) || requestError.status !== 401)) {
          setError("We could not restore your session. Please try again.");
        }
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    error,
    register: async (input: { email: string; password: string; firstName: string; lastName?: string }) => {
      setError(null);
      const result = await registerUser(input);
      setUser(result.user);
    },
    login: async (input: { email: string; password: string }) => {
      setError(null);
      const result = await loginUser(input);
      setUser(result.user);
    },
    logout: async () => {
      setError(null);
      await logoutUser();
      setUser(null);
    },
  }), [error, isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
