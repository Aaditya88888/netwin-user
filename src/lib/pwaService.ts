// PWA Service
// Handles Progressive Web App features including service worker registration,
// updates, and push notifications
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { ErrorReportingService } from "@/lib/errorReportingService";

/**
 * Service for managing Progressive Web App functionality
 */
export class PWAService {
  private static notificationPermission: NotificationPermission = 'default';
  private static pushEnabled = false;
  private static registration: ServiceWorkerRegistration | null = null;
  private static pushToken: string | null = null;
  
  /**
   * Initialize PWA functionality
   */
  static async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn("Service Worker is not supported in this browser");
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      // Check notification permission
      this.notificationPermission = Notification.permission;
      
      // Setup message listeners if we have permission
      if (this.notificationPermission === 'granted') {
        this.setupPushNotifications();
      }
      
      // Listen for service worker updates
      this.listenForUpdates();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      ErrorReportingService.captureError(error, { type: 'pwa_initialization_error' });
    }
  }
  
  /**
   * Check if the app is installed (in standalone mode)
   */
  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }
  
  /**
   * Request permission for push notifications
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn("Notifications not supported in this browser");
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        await this.setupPushNotifications();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      ErrorReportingService.captureError(error, { type: 'notification_permission_error' });
      return false;
    }
  }
  
  /**
   * Setup push notification handling
   */
  private static async setupPushNotifications(): Promise<void> {
    if (!messaging) return;
    
    try {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        this.pushToken = token;
        this.pushEnabled = true;
        // Save token to user profile or database
        this.savePushToken(token);
      } else {
        }
      
      // Handle foreground messages
      onMessage(messaging, (payload) => {
        this.showLocalNotification(
          payload.notification?.title || 'New notification',
          payload.notification?.body || '',
          payload.data
        );
      });
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      ErrorReportingService.captureError(error, { type: 'push_setup_error' });
    }
  }
  
  /**
   * Save the push token to the user's profile
   */
  private static async savePushToken(token: string): Promise<void> {
    // Implementation would save token to user's Firestore document
    // This would typically be handled by a user service or profile context
    }
  
  /**
   * Show a local notification when the app is in the foreground
   */
  private static showLocalNotification(title: string, body: string, data?: any): void {
    if (!this.registration) return;
    
    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      vibrate: [100, 50, 100],
      data
    };
    
    this.registration.showNotification(title, options).catch(error => {
      console.error('Error showing notification:', error);
    });
  }
  
  /**
   * Listen for service worker updates
   */
  private static listenForUpdates(): void {
    if (!this.registration) return;
    
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Alert the user about the update
          this.notifyAppUpdate();
        }
      });
    });
  }
  
  /**
   * Notify the user about an app update
   */
  private static notifyAppUpdate(): void {
    // This would typically show a UI toast or modal asking the user to refresh
    const event = new CustomEvent('pwa:update-available');
    window.dispatchEvent(event);
  }
  
  /**
   * Update the app by reloading the page
   */
  static updateApp(): void {
    window.location.reload();
  }
}

export default PWAService;
