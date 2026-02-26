import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  email: {
    tournaments: boolean;
    matches: boolean;
    results: boolean;
    marketing: boolean;
  };
  push: {
    tournaments: boolean;
    matches: boolean;
    results: boolean;
    reminders: boolean;
  };
  sms: {
    matches: boolean;
    reminders: boolean;
  };
  inApp: {
    all: boolean;
    tournaments: boolean;
    matches: boolean;
    results: boolean;
    social: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    tournaments: true,
    matches: true,
    results: true,
    marketing: false,
  },
  push: {
    tournaments: true,
    matches: true,
    results: true,
    reminders: true,
  },
  sms: {
    matches: false,
    reminders: false,
  },
  inApp: {
    all: true,
    tournaments: true,
    matches: true,
    results: true,
    social: true,
  },
};

export const useNotificationPreferences = () => {
  const { userProfile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadPreferences();
    }
  }, [userProfile?.uid]);

  const loadPreferences = async () => {
    try {
      setLoading(true);      // Try to load from localStorage first
      const stored = localStorage.getItem(`notification-preferences-${userProfile?.uid}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      setLoading(true);
      const updated = { ...preferences, ...newPreferences };
      
      // Save to localStorage (in real app, this would be saved to backend)
      localStorage.setItem(
        `notification-preferences-${userProfile?.uid}`,
        JSON.stringify(updated)
      );
      
      setPreferences(updated);
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEmailPreferences = async (emailPrefs: Partial<NotificationPreferences['email']>) => {
    const updated = {
      ...preferences,
      email: { ...preferences.email, ...emailPrefs }
    };
    return updatePreferences(updated);
  };

  const updatePushPreferences = async (pushPrefs: Partial<NotificationPreferences['push']>) => {
    const updated = {
      ...preferences,
      push: { ...preferences.push, ...pushPrefs }
    };
    return updatePreferences(updated);
  };

  const updateSmsPreferences = async (smsPrefs: Partial<NotificationPreferences['sms']>) => {
    const updated = {
      ...preferences,
      sms: { ...preferences.sms, ...smsPrefs }
    };
    return updatePreferences(updated);
  };

  const updateInAppPreferences = async (inAppPrefs: Partial<NotificationPreferences['inApp']>) => {
    const updated = {
      ...preferences,
      inApp: { ...preferences.inApp, ...inAppPrefs }
    };
    return updatePreferences(updated);
  };

  const resetToDefaults = async () => {
    return updatePreferences(defaultPreferences);
  };

  // Check if user has enabled specific notification types
  const hasEmailEnabled = () => {
    return Object.values(preferences.email).some(Boolean);
  };

  const hasPushEnabled = () => {
    return Object.values(preferences.push).some(Boolean);
  };

  const hasSmsEnabled = () => {
    return Object.values(preferences.sms).some(Boolean);
  };

  const hasInAppEnabled = () => {
    return preferences.inApp.all || Object.values(preferences.inApp).some(Boolean);
  };

  // Get notification permission status
  const getNotificationPermission = () => {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  };

  return {
    preferences,
    loading,
    updatePreferences,
    updateEmailPreferences,
    updatePushPreferences,
    updateSmsPreferences,
    updateInAppPreferences,
    resetToDefaults,
    hasEmailEnabled,
    hasPushEnabled,
    hasSmsEnabled,
    hasInAppEnabled,
    getNotificationPermission,
    requestNotificationPermission,
    loadPreferences,
  };
};
