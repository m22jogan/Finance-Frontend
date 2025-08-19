// src/hooks/use-auth.tsx

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// CORRECTED: Add the 'token' property to the User interface
interface User {
  id: string;
  email: string;
  token?: string; // It should be optional since it might not always exist (e.g., during loading or before login)
}

interface AuthContextType {
  user: User | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Pass the full User object, including the token, to the state
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      if (!res.ok) {
        throw new Error("Login failed");
      }
      const data = await res.json();

      // Store the token in localStorage and also in the state
      localStorage.setItem("auth_token", data.token);

      // Set the full user object including the token
      setUser({ id: data.user.id, email: data.user.email, token: data.token });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem("auth_token");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(undefined);
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser(undefined);
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest("GET", "/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          // When fetching, also include the token in the user state
          setUser({ id: data.id, email: data.email, token });
        } else {
          logout();
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        logout();
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