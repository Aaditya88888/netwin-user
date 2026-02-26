// Error Reporting Service
// Handles centralized error tracking and reporting
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";

/**
 * Error reporting service for tracking and reporting application errors
 */
export class ErrorReportingService {
  private static sentErrors = new Set<string>();

  /**
   * Initialize global error handlers
   */
  static initializeErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(event.reason || 'Unhandled Promise Rejection', {
          type: 'unhandled_promise_rejection',
          stack: event.reason?.stack,
        });
      });

      // Capture uncaught exceptions
      window.addEventListener('error', (event) => {
        this.captureError(event.error || event.message, {
          type: 'uncaught_exception',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
      
      }
  }

  /**
   * Log and report an error
   * @param error The error object or message
   * @param metadata Additional context about the error
   */
  static captureError(error: any, metadata: Record<string, any> = {}): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message || 'Unknown error';
    
    // Don't report the same error multiple times
    const errorKey = `${errorMessage}:${errorObj.stack}`;
    if (this.sentErrors.has(errorKey)) {
      return;
    }
    this.sentErrors.add(errorKey);
    
    // Cap the number of tracked errors to prevent memory issues
    if (this.sentErrors.size > 100) {
      this.sentErrors.clear();
    }

    // Log the error to console in development
    if (import.meta.env.DEV) {
      console.error('🔴 Error captured:', errorObj, metadata);
    }

    // In production, send to a Firebase function or other service
    if (import.meta.env.PROD) {
      this.reportToServer(errorObj, metadata).catch(err => {
        console.warn('Failed to report error to server:', err);
      });
    }
  }

  /**
   * Send error to backend for logging and analysis
   * @param error The error object
   * @param metadata Additional context about the error
   */
  private static async reportToServer(error: Error, metadata: Record<string, any> = {}): Promise<void> {
    try {
      // Get current user information if available
      const user = auth.currentUser;
      const userId = user?.uid;
      const userEmail = user?.email;

      // Prepare error data
      const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userId,
        userEmail,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...metadata
      };

      // In production, this would call a Cloud Function
      if (import.meta.env.PROD) {
        const functions = getFunctions();
        const reportError = httpsCallable(functions, 'reportError');
        await reportError(errorData);
      }
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  }
  
  /**
   * Track API errors
   * @param endpoint The API endpoint
   * @param status HTTP status code
   * @param message Error message
   */
  static trackApiError(endpoint: string, status: number, message: string): void {
    this.captureError(new Error(`API Error: ${message}`), {
      type: 'api_error',
      endpoint,
      status
    });
  }
  
  /**
   * Track Firebase operation errors
   * @param operation The Firebase operation that failed
   * @param error The error object
   */
  static trackFirebaseError(operation: string, error: any): void {
    this.captureError(error, {
      type: 'firebase_error',
      operation,
      code: error.code
    });
  }
}

export default ErrorReportingService;
