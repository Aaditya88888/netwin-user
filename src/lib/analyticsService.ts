// Analytics Service
// Comprehensive analytics tracking for the app using Firebase Analytics
import { getAnalytics, logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { app } from "@/lib/firebase";

// Initialize Analytics only in client-side and production
let analytics: any;

// Initialize analytics when in browser environment
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    } catch (error) {
    console.warn("⚠️ Analytics initialization failed:", error);
  }
}

/**
 * Analytics Service for tracking user behavior and app metrics
 */
export class AnalyticsService {
  /**
   * Track a user event
   * @param eventName Name of the event to track
   * @param eventParams Optional parameters for the event
   */
  static trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!analytics) return;

    try {
      logEvent(analytics, eventName, eventParams);
      
      if (import.meta.env.DEV) {
        }
    } catch (error) {
      console.warn(`⚠️ Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * Set the user ID for analytics
   * @param userId The user's unique identifier
   */
  static setUser(userId: string): void {
    if (!analytics) return;

    try {
      setUserId(analytics, userId);
      
      if (import.meta.env.DEV) {
        }
    } catch (error) {
      console.warn("⚠️ Failed to set user ID:", error);
    }
  }

  /**
   * Set user properties for segmentation
   * @param properties Object with user properties
   */
  static setUserProperties(properties: Record<string, any>): void {
    if (!analytics) return;

    try {
      setUserProperties(analytics, properties);
      
      if (import.meta.env.DEV) {
        }
    } catch (error) {
      console.warn("⚠️ Failed to set user properties:", error);
    }
  }

  // Tournament events
  static trackTournamentView(tournamentId: string, tournamentName: string): void {
    this.trackEvent('tournament_view', { tournamentId, tournamentName });
  }

  static trackTournamentJoin(tournamentId: string, tournamentName: string, entryFee: number): void {
    this.trackEvent('tournament_join', { tournamentId, tournamentName, entryFee });
  }

  // Wallet events
  static trackAddMoney(amount: number, paymentMethod: string, success: boolean): void {
    this.trackEvent('add_money', { amount, paymentMethod, success });
  }

  static trackWithdrawMoney(amount: number, paymentMethod: string, success: boolean): void {
    this.trackEvent('withdraw_money', { amount, paymentMethod, success });
  }

  // Authentication events
  static trackLogin(method: string): void {
    this.trackEvent('login', { method });
  }

  static trackSignup(method: string): void {
    this.trackEvent('signup', { method });
  }

  // KYC events
  static trackKycSubmission(documentType: string): void {
    this.trackEvent('kyc_submission', { documentType });
  }

  static trackKycStatus(status: string): void {
    this.trackEvent('kyc_status_change', { status });
  }

  // Page view events
  static trackScreenView(screenName: string, screenClass?: string): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || 'App',
    });
  }

  // Performance events
  static trackApiLatency(endpoint: string, latencyMs: number): void {
    this.trackEvent('api_latency', { endpoint, latencyMs });
  }

  static trackAppLoad(loadTimeMs: number): void {
    this.trackEvent('app_load', { loadTimeMs });
  }
}

export default AnalyticsService;
