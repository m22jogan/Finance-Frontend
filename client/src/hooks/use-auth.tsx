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
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  login: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      if (!res.ok) {
        throw new Error("Login failed");
      }
      const data = await res.json();

      // **Critical fix: Save the user ID to localStorage**
      localStorage.setItem("user_id_placeholder", data.id);

      setUser({ id: data.id, email: data.email });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest("GET", "/api/users/me");
        if (res.ok) {
          const data = await res.json();
          // Ensure user ID is persisted for subsequent requests
          if (data?.id) {
            localStorage.setItem("user_id_placeholder", data.id);
          }
          setUser({ id: data.id, email: data.email });
        } else {
          // Clear any stale user id if backend says not ok
          localStorage.removeItem("user_id_placeholder");
          setUser(undefined);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // Clear any stale user id on error (e.g., 401)
        localStorage.removeItem("user_id_placeholder");
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login }}>
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