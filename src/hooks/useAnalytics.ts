import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AnalyticsService } from '@/lib/analyticsService';
import { useAuth } from './useAuth';

/**
 * Hook for tracking user behavior with analytics
 */
export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Track page views on route changes
  useEffect(() => {
    const { pathname } = location;
    
    // Track current screen view
    AnalyticsService.trackScreenView(pathname);
    
  }, [location]);
  
  // Set user ID in analytics when user logs in
  useEffect(() => {
    if (user?.uid) {
      AnalyticsService.setUser(user.uid);
      
    // Set user properties if available
      if (user.displayName || user.email) {
        AnalyticsService.setUserProperties({
          hasName: !!user.displayName,
          hasEmail: !!user.email,
          isAnonymous: false, // Since we don't support anonymous auth
          authProvider: 'password' // Since we only support email/password auth now
        });
      }
    }
  }, [user]);
  
  // Tracking functions for components to use
  const trackEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    AnalyticsService.trackEvent(eventName, params);
  }, []);
  
  // Tournament-specific tracking
  const trackTournamentView = useCallback((tournamentId: string, tournamentName: string) => {
    AnalyticsService.trackTournamentView(tournamentId, tournamentName);
  }, []);
  
  const trackTournamentJoin = useCallback((tournamentId: string, tournamentName: string, entryFee: number) => {
    AnalyticsService.trackTournamentJoin(tournamentId, tournamentName, entryFee);
  }, []);
  
  // Wallet tracking
  const trackAddMoney = useCallback((amount: number, paymentMethod: string, success: boolean) => {
    AnalyticsService.trackAddMoney(amount, paymentMethod, success);
  }, []);
  
  const trackWithdrawMoney = useCallback((amount: number, paymentMethod: string, success: boolean) => {
    AnalyticsService.trackWithdrawMoney(amount, paymentMethod, success);
  }, []);
  
  return {
    trackEvent,
    trackTournamentView,
    trackTournamentJoin,
    trackAddMoney,
    trackWithdrawMoney
  };
};

export default useAnalytics;
