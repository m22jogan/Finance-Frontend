import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  userId?: string;
  email?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/users/me`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }

        const data = await res.json();
        setUserId(data.id);
        setEmail(data.email);
      } catch (err) {
        console.error("Error loading user:", err);

        // fallback: dev-only
        if (import.meta.env.DEV) {
          setUserId("user_12345");
          setEmail("demo@example.com");
        }
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ userId, email }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
