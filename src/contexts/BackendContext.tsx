import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Tournament, Match, KycDocument, Notification } from '@/types';

interface BackendContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth methods
  login: (phoneNumber: string, countryCode: string) => Promise<boolean>;
  verifyOtp: (phoneNumber: string, countryCode: string, otp: string) => Promise<boolean>;
  register: (userData: {
    phoneNumber: string;
    countryCode: string;
    otp: string;
    username: string;
    email?: string;
  }) => Promise<boolean>;
  logout: () => void;
  
  // User methods
  updateUser: (data: Partial<User>) => Promise<boolean>;
  updateWalletBalance: (newBalance: number) => Promise<boolean>;
  
  // Data
  tournaments: Tournament[];
  matches: Match[];
  kycDocuments: KycDocument[];
  notifications: Notification[];
  
  // Data methods
  refreshTournaments: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  refreshKycDocuments: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Real-time status
  isSocketConnected: boolean;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const useBackend = () => {
  const context = useContext(BackendContext);
  const useBackendAPI = import.meta.env.VITE_USE_BACKEND_API === 'true';
  
  if (context === undefined) {
    // If we're not using backend API, return null instead of throwing
    if (!useBackendAPI) {
      return null;
    }
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};

interface BackendProviderProps {
  children: ReactNode;
}

export const BackendProvider: React.FC<BackendProviderProps> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Data state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Placeholder implementations - implement these when you have a real backend
  const login = async (phoneNumber: string, countryCode: string): Promise<boolean> => {
    return false; // Return false to fall back to Firebase
  };

  const verifyOtp = async (phoneNumber: string, countryCode: string, otp: string): Promise<boolean> => {
    return false; // Return false to fall back to Firebase
  };

  const register = async (userData: any): Promise<boolean> => {
    return false; // Return false to fall back to Firebase
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (data: Partial<User>): Promise<boolean> => {
    return false;
  };

  const updateWalletBalance = async (newBalance: number): Promise<boolean> => {
    return false;
  };

  const refreshTournaments = async (): Promise<void> => {
    };

  const refreshMatches = async (): Promise<void> => {
    };

  const refreshKycDocuments = async (): Promise<void> => {
    };

  const refreshNotifications = async (): Promise<void> => {
    };

  const contextValue: BackendContextType = {
    // Auth state
    user,
    isAuthenticated,
    isLoading,
    
    // Auth methods
    login,
    verifyOtp,
    register,
    logout,
    
    // User methods
    updateUser,
    updateWalletBalance,
    
    // Data
    tournaments,
    matches,
    kycDocuments,
    notifications,
    
    // Data methods
    refreshTournaments,
    refreshMatches,
    refreshKycDocuments,
    refreshNotifications,
    
    // Real-time status
    isSocketConnected: false
  };

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
};
