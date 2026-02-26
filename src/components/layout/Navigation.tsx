import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  GamepadIcon,
  Wallet,
  UserCircle,
  HelpCircle,
  Home
} from "lucide-react";

const menuItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Tournaments", icon: Trophy, href: "/tournaments" },
  { label: "My Squad", icon: Users, href: "/squad" },
  { label: "My Matches", icon: GamepadIcon, href: "/matches" },
  { label: "Wallet", icon: Wallet, href: "/wallet" },
  // { label: "Leaderboard", icon: Medal, href: "/leaderboard" }, // Hidden until implemented
  { label: "Profile", icon: UserCircle, href: "/profile" },
  { label: "Support", icon: HelpCircle, href: "/support" },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-dark-card border-r border-gray-800 p-4">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              to={item.href} 
              className="block"
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 font-normal",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 