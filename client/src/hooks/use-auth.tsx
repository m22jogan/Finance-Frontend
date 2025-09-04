// src/hooks/use-auth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  // Fetch current user
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/v1/auth/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser({ id: data.id, email: data.email });
    } catch (err) {
      console.warn("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/v1/auth/login", { email, password });
      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      // Cookie is set automatically by backend (HttpOnly, Secure, SameSite=None)
      setUser({ id: data.user.id, email: data.user.email });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await apiRequest("POST", "/api/v1/auth/logout"); // optional backend call
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUser(null);
      setLoading(false);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
