import React from "react";
import { createContext, useContext } from "react";
import { useFirebase } from "./FirebaseContext";
import { User } from "firebase/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useFirebase();

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 