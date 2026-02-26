import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";

export function Header() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-dark-card border-b border-gray-800 z-50">
      <div className="container h-full flex items-center justify-between">
        <Link to="/" className="no-underline flex items-center gap-2">
          <img src="/netwin-logo.png" alt="Netwin Logo" className="h-10 w-10 object-contain" style={{ borderRadius: 8 }} />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            Netwin
          </h1>
        </Link>

        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
} 