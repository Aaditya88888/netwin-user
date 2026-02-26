import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationCenter from "@/components/common/NotificationCenter";
import GlobalSearch from "@/components/common/GlobalSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserId } from "@/utils/userHelpers";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Wallet, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const Header = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { unreadCount, getNotifications } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
    const handleNotificationsClick = () => {
    if (user) {
      const userId = getUserId(user);
      if (userId) {
        getNotifications(userId);
        setNotificationsOpen(true);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Get initials from display name or email
  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.substring(0, 2).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "UN"; // UN for Unknown
  };

  // Get display name or email for profile
  const getDisplayIdentifier = () => {
    return userProfile?.displayName || userProfile?.email || user?.email || "Unknown User";
  };

  // Get secondary identifier (phone or email)
  const getSecondaryIdentifier = () => {
    return userProfile?.phoneNumber || userProfile?.email || user?.email || "";
  };
  return (
    <header className="bg-dark-card bg-opacity-90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
              <img src="/netwin-logo.png" alt="NetWin" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div className="text-xl sm:text-2xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                NETWIN
              </div>
            </div>
          </div>
            {/* Search - Show on desktop only */}
          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <GlobalSearch 
              placeholder="Search tournaments, players..." 
              className="w-full"
            />
          </div>
            {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wallet */}
            {userProfile && (
              <div className="gradient-border hidden sm:block">
                <div onClick={() => navigate("/wallet")} className="flex items-center gap-2 bg-dark-card px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer">
                    <Wallet className="h-4 w-4 text-accent" />
                    <span className="font-medium text-white text-sm">
                    {formatCurrency(userProfile.walletBalance || 0, userProfile.currency)}
                    </span>
                </div>
              </div>
            )}
            
            {/* Notifications */}
            {user && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-2 text-gray-300 hover:text-white relative h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleNotificationsClick}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            )}
            
            {/* User Avatar with Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-primary">
                      <AvatarImage src={userProfile?.photoURL} alt={getDisplayIdentifier()} />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-dark-card border border-gray-800" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{getDisplayIdentifier()}</span>
                      <span className="text-xs text-gray-400">{getSecondaryIdentifier()}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-dark-lighter"
                    onClick={() => navigate("/profile")}
                  >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-dark-lighter"
                    onClick={() => navigate("/wallet")}
                  >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-dark-lighter"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-dark-lighter text-red-500 focus:text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      
      {/* Notifications Panel */}
      <NotificationCenter 
        open={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </header>
  );
};

export default Header;
