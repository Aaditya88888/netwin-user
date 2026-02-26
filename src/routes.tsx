import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { Suspense } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from '@/hooks/useAuth';

// Loading component
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-dark">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import CompleteProfile from "@/pages/auth/CompleteProfile";
import { EmailVerification } from "@/components/auth/EmailVerification";

// User Pages - Lazy loaded
const Home = React.lazy(() => import("@/pages/dashboard/Home"));
const Tournaments = React.lazy(() => import("@/pages/tournaments/Tournaments"));
const TournamentDetails = React.lazy(() => import("@/pages/tournaments/TournamentDetails"));
const MyMatches = React.lazy(() => import("@/pages/matches/MyMatches"));
const MatchDetail = React.lazy(() => import("@/pages/matches/MatchDetail"));
const Leaderboard = React.lazy(() => import("@/pages/leaderboard/Leaderboard"));
const Wallet = React.lazy(() => import("@/pages/wallet/Wallet"));
const Profile = React.lazy(() => import("@/pages/profile/Profile"));
const KycVerification = React.lazy(() => import("@/pages/profile/KycVerification"));
// const Squad = React.lazy(() => import("@/pages/squad/Squad"));
const Support = React.lazy(() => import("@/pages/support/Support"));
const Settings = React.lazy(() => import("@/pages/settings/Settings"));
// const Teams = React.lazy(() => import("@/pages/teams/Teams"));
const Notifications = React.lazy(() => import("@/pages/notifications/Notifications"));
const Announcements = React.lazy(() => import("@/pages/announcements/Announcements"));

// Error Page
import NotFound from "@/pages/not-found";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Always render children if on /auth/complete-profile
  if (location.pathname === '/auth/complete-profile') {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-dark">Loading...</div>;
  }

  if (user) {
    // Check if user has incomplete Google profile data in session
    const incompleteUserData = sessionStorage.getItem('incompleteGoogleUser');

    // If profile is incomplete, redirect to /auth/complete-profile (but never from /auth/complete-profile)
    if ((incompleteUserData && !userProfile) || (userProfile && (!userProfile.username || !userProfile.country))) {
      if (location.pathname !== '/auth/complete-profile') {
        return <Navigate to="/auth/complete-profile" replace />;
      } else {
        // Already on complete-profile, render children
        return <>{children}</>;
      }
    }

    // User is fully authenticated with complete profile, redirect to dashboard
    if (userProfile && userProfile.username && userProfile.country) {
      if (location.pathname === '/login' || location.pathname === '/signup') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-dark">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has incomplete Google profile data in session
  const incompleteUserData = sessionStorage.getItem('incompleteGoogleUser');
  
  if (incompleteUserData && !userProfile) {
    // User signed in with Google but hasn't completed profile
    return <Navigate to="/auth/complete-profile" replace />;
  }

  // Check if user profile exists but is incomplete (missing required fields)
  if (userProfile && (!userProfile.username || !userProfile.country)) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  return <>{children}</>;
};

const CompleteProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-dark">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user profile is complete, redirect to dashboard
  if (userProfile && userProfile.username && userProfile.country) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function AppRoutes() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      {/* Root Route with explicit redirect */}
      <Route
        path="/"
        element={
          loading ? (
            <div className="flex h-screen items-center justify-center bg-dark">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
              <span className="text-white">Loading...</span>
            </div>
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/auth/complete-profile" element={<CompleteProfileRoute><CompleteProfile /></CompleteProfileRoute>} />
      <Route path="/auth/verify-email" element={<EmailVerification />} />
      {/* User Dashboard at /dashboard (canonical) */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner />}><Home /></Suspense>} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="tournaments" element={<Suspense fallback={<LoadingSpinner />}><Tournaments /></Suspense>} />
        <Route path="tournaments/:id" element={<Suspense fallback={<LoadingSpinner />}><TournamentDetails /></Suspense>} />
        <Route path="matches" element={<Suspense fallback={<LoadingSpinner />}><MyMatches /></Suspense>} />
        <Route path="matches/:id" element={<Suspense fallback={<LoadingSpinner />}><MatchDetail /></Suspense>} />
        <Route path="leaderboard" element={<Suspense fallback={<LoadingSpinner />}><Leaderboard /></Suspense>} />
        <Route path="wallet" element={<Suspense fallback={<LoadingSpinner />}><Wallet /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<LoadingSpinner />}><Profile /></Suspense>} />
        <Route path="kyc" element={<Suspense fallback={<LoadingSpinner />}><KycVerification /></Suspense>} />
        <Route path="profile/kyc" element={<Suspense fallback={<LoadingSpinner />}><KycVerification /></Suspense>} />
        {/* <Route path="squad" element={<Suspense fallback={<LoadingSpinner />}><Squad /></Suspense>} /> */}
        <Route path="support" element={<Suspense fallback={<LoadingSpinner />}><Support /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>} />
        {/* <Route path="teams" element={<Suspense fallback={<LoadingSpinner />}><Teams /></Suspense>} /> */}
        <Route path="notifications" element={<Suspense fallback={<LoadingSpinner />}><Notifications /></Suspense>} />
        <Route path="announcements" element={<Suspense fallback={<LoadingSpinner />}><Announcements /></Suspense>} />
      </Route>
      {/* Remove backward compatibility routes and dashboard redirects */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
