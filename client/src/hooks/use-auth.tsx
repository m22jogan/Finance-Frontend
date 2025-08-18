import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define the shape of your authentication context
interface AuthContextType {
  userId: string | undefined;
  // You can add more properties and functions here, like `login`, `logout`, `isLoading`
}

// Create the context with the defined type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      // Replace this with your actual authentication logic
      const fetchedUserId = "user_12345";
      setUserId(fetchedUserId);
    };

    fetchUser();
  }, []);

  const value: AuthContextType = { userId };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Define the custom hook to use the authentication context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
