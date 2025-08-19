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
  logout: () => void; // Add logout to the context type
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  login: async () => {},
  logout: () => {}, // Add a default empty function
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  // 1. Update the login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Endpoint is now /api/auth/login
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      if (!res.ok) {
        throw new Error("Login failed");
      }
      const data = await res.json(); // Expects { user: { id, email }, token: "..." }

      // Save the JWT to localStorage
      localStorage.setItem("auth_token", data.token);

      // Set user from the nested user object in the response
      setUser({ id: data.user.id, email: data.user.email });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      // Clean up any stale token on login failure
      localStorage.removeItem("auth_token");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 2. Add a logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(undefined);
    navigate("/login");
  };

  // 3. Update the initial user fetch logic
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // If there's no token, we're definitely not logged in.
        setUser(undefined);
        setLoading(false);
        return;
      }

      try {
        // With a token, try to get the user's profile
        // apiRequest will automatically add the 'Authorization' header
        const res = await apiRequest("GET", "/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.id, email: data.email });
        } else {
          // If the token is invalid (e.g., expired), log out
          logout();
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // Any error with the token means we should log out
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // The empty dependency array is correct here

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