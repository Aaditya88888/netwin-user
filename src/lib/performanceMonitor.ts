// Performance monitoring and analytics
import { getPerformance, trace, PerformanceTrace } from "firebase/performance";
import { app } from '@/lib/firebase';
import { AnalyticsService } from './analyticsService';
import { ErrorReportingService } from './errorReportingService';

// Initialize Firebase Performance if available
let firebasePerf: any;

if (typeof window !== 'undefined') {
  try {
    firebasePerf = getPerformance(app);
    } catch (error) {
    console.warn("⚠️ Firebase Performance initialization failed:", error);
  }
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, number> = new Map();
  private traces: Map<string, PerformanceTrace> = new Map();
  private navigationStart: number = 0;

  private constructor() {
    this.navigationStart = performance ? performance.now() : Date.now();
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    // Core Web Vitals monitoring
    this.observeWebVitals();
    
    // Navigation timing
    this.observeNavigationTiming();
    
    // Resource loading
    this.observeResourceTiming();
    
    // Long tasks
    this.observeLongTasks();
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];          this.metrics.set('LCP', lastEntry.startTime);
          // this.logMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {        // LCP observer not supported
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;            this.metrics.set('FID', fid);
            // this.logMetric('FID', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {        // FID observer not supported
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });          this.metrics.set('CLS', clsValue);
          // this.logMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {        // CLS observer not supported
      }
    }
  }

  private observeNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {          const metrics = {
            'DNS_Time': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP_Time': navigation.connectEnd - navigation.connectStart,
            'Request_Time': navigation.responseStart - navigation.requestStart,
            'Response_Time': navigation.responseEnd - navigation.responseStart,
            'DOM_Parse_Time': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            'DOM_Ready_Time': navigation.domContentLoadedEventEnd - navigation.startTime,
            'Load_Complete_Time': navigation.loadEventEnd - navigation.startTime,
          };          Object.entries(metrics).forEach(([key, value]) => {
            this.metrics.set(key, value);
            // this.logMetric(key, value);
          });
        }
      }, 0);
    });
  }

  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource' && (entry.name.includes('.js') || entry.name.includes('.css'))) {
              const resourceEntry = entry as PerformanceResourceTiming;
              const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;              if (loadTime > 1000) { // Log slow resources (>1s)
                // Slow resource detected
              }
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);      } catch (error) {
        // Resource observer not supported
      }
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {            // Long task detected
            // this.logMetric('Long_Task', entry.duration);
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);      } catch (error) {
        // Long task observer not supported
      }
    }
  }
  private logMetric(name: string, value: number): void {
    if (import.meta.env.DEV) {
      // Performance metric logged in dev mode
    }
    
    // In production, you would send this to your analytics service
    // Example: sendToAnalytics(name, value);
  }

  // Measure custom performance
  startTiming(label: string): void {
    performance.mark(`${label}-start`);
  }

  endTiming(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    const duration = measure.duration;    
    // this.logMetric(label, duration);
    // Cleanup
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }

  // Get all collected metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  // Report performance summary
  generateReport(): void {
    const metrics = this.getMetrics();
    
    // console.group('📊 Performance Report');
    // console.table(metrics);
    // console.groupEnd();
    
    // Check against performance budgets
    this.checkPerformanceBudgets(metrics);
  }

  private checkPerformanceBudgets(metrics: Record<string, number>): void {
    const budgets = {
      LCP: 2500, // 2.5s
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1
      Load_Complete_Time: 3000, // 3s
    };

    const violations = Object.entries(budgets)
      .filter(([metric, budget]) => (metrics[metric] || 0) > budget)
      .map(([metric, budget]) => ({
        metric,
        actual: metrics[metric],
        budget,
        excess: metrics[metric] - budget
      }));    if (violations.length > 0) {
      // Performance budget violations detected
    } else {
      // All performance budgets met
    }
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // Start a custom performance trace
  startTrace(traceName: string, attributes: Record<string, string> = {}): void {
    if (!firebasePerf) return;
    
    try {
      const newTrace = trace(firebasePerf, traceName);
      
      // Set custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        newTrace.putAttribute(key, value);
      });
      
      newTrace.start();
      this.traces.set(traceName, newTrace);
    } catch (error) {
      console.warn(`⚠️ Error starting trace ${traceName}:`, error);
    }
  }
  
  // Stop a performance trace
  stopTrace(traceName: string): void {
    if (!firebasePerf) return;
    
    try {
      const activeTrace = this.traces.get(traceName);
      
      if (activeTrace) {
        activeTrace.stop();
        this.traces.delete(traceName);
      }
    } catch (error) {
      console.warn(`⚠️ Error stopping trace ${traceName}:`, error);
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, method: string, startTime: number): void {
    const endTime = performance ? performance.now() : Date.now();
    const duration = endTime - startTime;
    
    // Use Firebase Performance trace
    const traceName = `api_call_${method}_${endpoint.split('/').pop()}`;
    this.startTrace(traceName, { 
      endpoint, 
      method,
      durationMs: duration.toFixed(0)
    });
    this.stopTrace(traceName);
    
    // Also log for analytics
    if (AnalyticsService) {
      AnalyticsService.trackApiLatency(endpoint, Math.round(duration));
    }
    
    // Store in metrics map
    this.metrics.set(`API_${method}_${endpoint}`, duration);
  }
}

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): PerformanceMonitor => {
  const monitor = PerformanceMonitor.getInstance();
  
  // Generate report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.generateReport();
    }, 5000); // Wait 5s after load
  });
  
  return monitor;
};

export default PerformanceMonitor;
