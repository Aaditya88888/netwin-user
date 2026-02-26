import { getToken } from 'firebase/app-check';
import { appCheck } from './firebase';

// App Check utility functions
export interface AppCheckStatus {
  isEnabled: boolean;
  hasToken: boolean;
  error?: string;
  token?: string;
}

/**
 * Get App Check status and token
 */
export const getAppCheckStatus = async (): Promise<AppCheckStatus> => {
  if (!appCheck) {
    return {
      isEnabled: false,
      hasToken: false,
      error: 'App Check not initialized'
    };
  }

  try {
    const result = await getToken(appCheck, false);
    return {
      isEnabled: true,
      hasToken: true,
      token: result.token
    };
  } catch (error) {
    console.warn('Failed to get App Check token:', error);
    return {
      isEnabled: true,
      hasToken: false,
      error: error instanceof Error ? error.message : 'Failed to get token'
    };
  }
};

/**
 * Get App Check token for API requests
 */
export const getAppCheckToken = async (forceRefresh = false): Promise<string | null> => {
  if (!appCheck) {
    console.warn('App Check not available');
    return null;
  }

  try {
    const result = await getToken(appCheck, forceRefresh);
    return result.token;
  } catch (error) {
    console.warn('App Check token retrieval failed:', error);
    return null;
  }
};

/**
 * Initialize debug mode for development
 */
export const initializeDebugMode = (): void => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
    
    if (debugToken && debugToken !== 'true' && debugToken !== 'your_debug_token_here') {
      // Use specific debug token if provided
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      } else {
      // Use default debug mode - Firebase will generate a token automatically
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
  }
};

/**
 * Check if App Check is properly configured
 */
export const isAppCheckConfigured = (): boolean => {
  return appCheck !== undefined;
};

/**
 * Get environment-specific App Check info
 */
export const getAppCheckInfo = () => {
  return {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    hasDebugToken: !!import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN,
    hasRecaptchaKey: !!import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    isConfigured: isAppCheckConfigured()
  };
};
