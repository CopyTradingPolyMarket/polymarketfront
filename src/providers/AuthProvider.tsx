"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { API_BASE } from "@/src/config/api";

type User = any;

type AuthContextType = {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, ready, getAccessToken } = usePrivy();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!authenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const token = await getAccessToken();

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data);
      setLoading(false);
    } catch {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchUser();
  }, [ready, authenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};