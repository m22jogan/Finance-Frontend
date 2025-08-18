import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter"; // Import useLocation for redirection

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | undefined;
  loading: boolean;
}

// Define a placeholder or default value for the context
const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [_, navigate] = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest("GET", "/api/users/me");
        if (!res.ok) {
          // Handle unauthenticated state
          navigate("/login");
        } else {
          const data = await res.json();
          setUser({ id: data.id, email: data.email });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // Redirect to login on network or other errors
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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