import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { BackendProvider } from "@/contexts/BackendContext";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import { UpdateNotification, InstallPrompt } from "@/components/common/UpdateNotification";
import AppRoutes from "./routes";

function App() {
  // Enable backend API mode with environment variable
  const useBackendAPI = import.meta.env.VITE_USE_BACKEND_API === 'true';

  // Conditional provider based on environment
  const AuthProvider = useBackendAPI ? BackendProvider : FirebaseProvider;

  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >        <ThemeProvider>
          <AuthProvider>            <WalletProvider>              <TournamentProvider>                <ConnectionStatus />
                <AppRoutes />
                <UpdateNotification />
                <InstallPrompt />
                <Toaster />
              </TournamentProvider>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
