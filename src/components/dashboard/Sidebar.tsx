import React from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  Home, Trophy, Calendar, Wallet,
  User, HelpCircle, Settings, Bell, MessageSquare
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname === path;
  };
  return (
    <aside className="hidden md:block w-56 bg-dark-card border-r border-gray-800 h-[calc(100vh-4rem)] fixed top-16 overflow-y-auto custom-scrollbar">
      <nav className="p-3">
        <ul className="space-y-1">
          <li>
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/tournaments" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/tournaments") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Trophy className="h-5 w-5" />
              <span>Tournaments</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/matches" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/matches") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Calendar className="h-5 w-5" />
              <span>My Matches</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/wallet" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/wallet") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Wallet className="h-5 w-5" />
              <span>Wallet</span>
            </Link>
          </li>
          {/*
          <li>
            <Link 
              to="/leaderboard" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/leaderboard") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <BarChart2 className="h-5 w-5" />
              <span>Leaderboard</span>
            </Link>
          </li>
          */}
          <li>
            <Link 
              to="/profile" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/profile") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </li>
        </ul>
        <ul className="space-y-1 pb-2">
          <li>
            <Link 
              to="/settings" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/settings") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/support" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/support") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/notifications" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/notifications") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/announcements" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive("/announcements") ? "bg-primary bg-opacity-20 text-white" : "text-gray-300 hover:text-white hover:bg-dark-lighter"}`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Announcements</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
