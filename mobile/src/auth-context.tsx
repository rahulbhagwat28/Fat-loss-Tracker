import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiJson, clearStoredSession, getStoredSessionId, setStoredSessionId } from "./api";
import type { User } from "./types";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiJson<{ user: User | null }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    getStoredSessionId().then((id) => {
      if (!id) {
        setLoading(false);
        return;
      }
      refreshUser().finally(() => setLoading(false));
    });
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiJson<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    await setStoredSessionId(data.user.id);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await apiJson<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      }),
    });
    await setStoredSessionId(data.user.id);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiJson("/api/auth/logout", { method: "POST" });
    } catch {}
    await clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
