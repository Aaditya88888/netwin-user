import { useState, useEffect, useCallback } from 'react';
import { PWAService } from '@/lib/pwaService';

/**
 * Hook for using Progressive Web App features
 */
export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  
  // Check if app is installed (standalone mode)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkInstallState = () => {
        setIsInstalled(PWAService.isInstalled());
      };
      
      checkInstallState();
      
      // Check on display mode changes
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      mediaQuery.addEventListener('change', checkInstallState);
      
      return () => {
        mediaQuery.removeEventListener('change', checkInstallState);
      };
    }
  }, []);
  
  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);
  
  // Listen for update events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleUpdateAvailable = () => {
        setUpdateAvailable(true);
      };
      
      window.addEventListener('pwa:update-available', handleUpdateAvailable);
      
      return () => {
        window.removeEventListener('pwa:update-available', handleUpdateAvailable);
      };
    }
  }, []);
  
  // Request notification permission
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    const result = await PWAService.requestNotificationPermission();
    setNotificationPermission(Notification.permission);
    return result;
  }, []);
  
  // Apply available update
  const applyUpdate = useCallback(() => {
    PWAService.updateApp();
    setUpdateAvailable(false);
  }, []);
  
  return {
    isInstalled,
    notificationPermission,
    updateAvailable,
    requestNotifications,
    applyUpdate
  };
};

export default usePWA;
