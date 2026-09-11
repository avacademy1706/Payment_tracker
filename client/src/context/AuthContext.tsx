import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserRole } from "@shared/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { user: AuthUser } }>("/auth/me");
      return res.data.data.user;
    },
    retry: false,
    staleTime: Infinity,
  });

  const login = React.useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ success: true; data: { user: AuthUser } }>("/auth/login", { email, password });
      queryClient.setQueryData(["auth", "me"], res.data.data.user);
    },
    [queryClient]
  );

  const logout = React.useCallback(async () => {
    await api.post("/auth/logout");
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user: data ?? null, isLoading, login, logout }),
    [data, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
