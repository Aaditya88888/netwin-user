import { toast } from '@/hooks/use-toast';

interface NetworkError {
  code: string;
  message: string;
  isNetworkError: boolean;
}

interface ErrorWithCodeAndMessage {
  code?: string;
  message?: string;
}

export const handleNetworkError = (error: ErrorWithCodeAndMessage | Error | unknown): NetworkError => {
  // Firebase specific error codes for network issues
  const networkErrorCodes = [
    'unavailable', 
    'deadline-exceeded', 
    'permission-denied',
    'network-request-failed',
    'offline'
  ];

  const errorObj = error as ErrorWithCodeAndMessage;
  const isNetworkError = networkErrorCodes.some(code => 
    errorObj?.code?.includes(code) || errorObj?.message?.toLowerCase().includes(code)
  );

  return {
    code: errorObj?.code || 'unknown-error',
    message: errorObj?.message || 'An unknown error occurred',
    isNetworkError
  };
};

export const showNetworkErrorToast = (error: ErrorWithCodeAndMessage | Error | unknown) => {
  const networkError = handleNetworkError(error);
  
  if (networkError.isNetworkError) {
    toast({
      title: "Connection Issue",
      description: "Please check your internet connection and try again. The app will work in offline mode with limited functionality.",
      variant: "destructive",
      duration: 5000,
    });
  } else {
    toast({
      title: "Error",
      description: networkError.message,
      variant: "destructive",
    });
  }
};

export const handleAuthenticationError = (error: ErrorWithCodeAndMessage | Error | unknown) => {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
  };

  const errorObj = error as ErrorWithCodeAndMessage;
  const message = errorMap[errorObj?.code || ''] || errorObj?.message || 'Authentication failed. Please try again.';
  
  toast({
    title: "Authentication Error",
    description: message,
    variant: "destructive",
  });

  return message;
};

export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const networkError = handleNetworkError(error);
      
      // Don't retry if it's not a network error or if we've exhausted retries
      if (!networkError.isNetworkError || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
