import React from "react";
import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNavigation from "@/components/dashboard/MobileNavigation";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <Header />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <main className="flex-1 md:ml-56 p-3 sm:p-4 pb-20 md:pb-4 max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default MainLayout;
