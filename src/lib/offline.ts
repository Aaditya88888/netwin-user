// Offline handling utilities
import React from "react";
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from './firebase';

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private listeners: ((isOnline: boolean) => void)[] = [];

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async handleOnline() {
    this.isOnline = true;
    
    try {
      await enableNetwork(db);
      } catch (error) {
      console.warn('Failed to enable Firestore network:', error);
    }
    
    this.notifyListeners();
  }

  private async handleOffline() {
    this.isOnline = false;
    
    try {
      await disableNetwork(db);
      } catch (error) {
      console.warn('Failed to disable Firestore network:', error);
    }
    
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public getConnectionStatus(): boolean {
    return this.isOnline;
  }

  public addListener(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  public async forceReconnect() {
    try {
      if (navigator.onLine) {
        await enableNetwork(db);
        this.isOnline = true;
        this.notifyListeners();
        }
    } catch (error) {
      console.error('Failed to force reconnection:', error);
    }
  }
}

// Hook for React components
export const useOffline = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const offlineManager = OfflineManager.getInstance();
    const unsubscribe = offlineManager.addListener(setIsOnline);
    
    return unsubscribe;
  }, []);
  
  return {
    isOnline,
    forceReconnect: () => OfflineManager.getInstance().forceReconnect()
  };
};

// Initialize offline manager
export const initializeOfflineSupport = () => {
  OfflineManager.getInstance();
  };
