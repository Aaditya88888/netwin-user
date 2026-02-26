import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, Trophy, Wallet, User, Bell } from "lucide-react";

const MobileNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname === path;
  };
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-gray-800 z-50">
      <div className="flex justify-between">
        <Link
          to="/"
          className={`flex-1 py-3 px-2 text-center ${
            isActive("/") ? "text-white nav-active" : "text-gray-400 hover:text-white"
          } relative`}
        >
          <Home className="h-5 w-5 block mx-auto" />
          <span className="text-xs">Home</span>
          <div className="nav-indicator"></div>
        </Link>
        <Link
          to="/tournaments"
          className={`flex-1 py-3 px-2 text-center ${
            isActive("/tournaments") ? "text-white nav-active" : "text-gray-400 hover:text-white"
          } relative`}
        >
          <Trophy className="h-5 w-5 block mx-auto" />
          <span className="text-xs">Tournaments</span>
          <div className="nav-indicator"></div>
        </Link>
        <Link
          to="/wallet"
          className={`flex-1 py-3 px-2 text-center ${
            isActive("/wallet") ? "text-white nav-active" : "text-gray-400 hover:text-white"
          } relative`}
        >
          <Wallet className="h-5 w-5 block mx-auto" />
          <span className="text-xs">Wallet</span>
          <div className="nav-indicator"></div>
        </Link>
        <Link
          to="/notifications"
          className={`flex-1 py-3 px-2 text-center ${
            isActive("/notifications") ? "text-white nav-active" : "text-gray-400 hover:text-white"
          } relative`}
        >
          <Bell className="h-5 w-5 block mx-auto" />
          <span className="text-xs">Notifications</span>
          <div className="nav-indicator"></div>
        </Link>
        <Link
          to="/profile"
          className={`flex-1 py-3 px-2 text-center ${
            isActive("/profile") ? "text-white nav-active" : "text-gray-400 hover:text-white"
          } relative`}
        >
          <User className="h-5 w-5 block mx-auto" />
          <span className="text-xs">Profile</span>
          <div className="nav-indicator"></div>
        </Link>
      </div>
    </div>
  );
};

export default MobileNavigation;
