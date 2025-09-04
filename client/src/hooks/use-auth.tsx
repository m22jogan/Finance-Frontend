// src/hooks/use-auth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/v1/auth/login", { email, password });
      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      // Cookie is set automatically by the backend (HttpOnly, Secure)
      setUser({ id: data.user.id, email: data.user.email });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Optional: if you add a /logout endpoint, call it here to clear cookie
      await apiRequest("POST", "/api/v1/auth/logout");
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUser(undefined);
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest("GET", "/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.id, email: data.email });
        } else {
          setUser(undefined);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
