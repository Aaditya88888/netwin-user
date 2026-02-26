import React from "react";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <Navigation />
      <main className="pt-16 pl-64">
        <div className="container py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 