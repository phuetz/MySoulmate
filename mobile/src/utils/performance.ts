/**
 * Performance Optimization Utilities
 * Tools for monitoring and optimizing React Native performance
 */

import { InteractionManager, Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private isEnabled: boolean = __DEV__;

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.isEnabled) return;
    performance.mark(`${name}-start`);
  }

  /**
   * Measure time since mark and log
   */
  measure(name: string, log: boolean = true): number | null {
    if (!this.isEnabled) return null;

    try {
      performance.mark(`${name}-end`);
      const measure = performance.measure(name, `${name}-start`, `${name}-end`);
      const duration = measure.duration;

      // Store metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);

      if (log && duration > 100) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }

      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);

      return duration;
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error);
      return null;
    }
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const durations = this.metrics.get(name);
    if (!durations || durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Get all metrics summary
   */
  getSummary(): Record<string, { avg: number; count: number; max: number }> {
    const summary: Record<string, { avg: number; count: number; max: number }> = {};

    this.metrics.forEach((durations, name) => {
      summary[name] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        count: durations.length,
        max: Math.max(...durations)
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string): void {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const duration = Date.now() - startTime.current;

    if (duration > 16) { // More than one frame (60fps = 16.67ms)
      console.warn(
        `⚠️ Slow render: ${componentName} took ${duration}ms (render #${renderCount.current})`
      );
    }

    startTime.current = Date.now();
  });
}

/**
 * Debounce function for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle function for frequent updates
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Execute callback after interactions finish
 */
export function runAfterInteractions(callback: () => void): void {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
}

/**
 * Hook to run effect after interactions
 */
export function useAfterInteractions(effect: () => void | (() => void), deps: any[]): void {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      effect();
    });

    return () => task.cancel();
  }, deps);
}

/**
 * Memoize expensive computations
 */
export function useMemoizedValue<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

/**
 * Stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Monitor FPS (frames per second)
 */
class FPSMonitor {
  private frameCount: number = 0;
  private lastTime: number = Date.now();
  private fps: number = 60;
  private rafId: number | null = null;

  start(): void {
    if (this.rafId !== null) return;

    const measureFPS = () => {
      this.frameCount++;
      const currentTime = Date.now();
      const elapsed = currentTime - this.lastTime;

      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastTime = currentTime;

        if (this.fps < 30) {
          console.warn(`⚠️ Low FPS detected: ${this.fps} fps`);
        }
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS(): number {
    return this.fps;
  }
}

export const fpsMonitor = new FPSMonitor();

/**
 * Image loading optimization
 */
export const imageOptimization = {
  /**
   * Get optimized image URI based on device
   */
  getOptimizedUri(baseUri: string, width: number, height: number): string {
    // Add width/height parameters for server-side resizing
    const separator = baseUri.includes('?') ? '&' : '?';
    return `${baseUri}${separator}w=${width}&h=${height}&q=80`;
  },

  /**
   * Get appropriate image size multiplier for device
   */
  getImageSizeMultiplier(): number {
    const { width } = require('react-native').Dimensions.get('window');
    if (width >= 1024) return 3; // iPad Pro
    if (width >= 768) return 2; // iPad
    if (width >= 414) return 2; // iPhone Plus
    return 1; // iPhone
  }
};

/**
 * List optimization utilities
 */
export const listOptimization = {
  /**
   * Calculate optimal item layout
   */
  getItemLayout: (data: any[], index: number, itemHeight: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index
  }),

  /**
   * Key extractor for FlatList
   */
  keyExtractor: (item: any, index: number) => {
    return item.id?.toString() || index.toString();
  },

  /**
   * Optimal FlatList configuration
   */
  optimizedFlatListProps: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 5,
    ...Platform.select({
      android: {
        removeClippedSubviews: true,
      },
    }),
  }
};

/**
 * Memory optimization utilities
 */
export const memoryOptimization = {
  /**
   * Clear image cache
   */
  async clearImageCache(): Promise<void> {
    try {
      const { Image } = await import('react-native');
      if (Image.clearMemoryCache) {
        Image.clearMemoryCache();
      }
      if (Image.clearDiskCache) {
        Image.clearDiskCache();
      }
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  },

  /**
   * Get memory usage (iOS only)
   */
  getMemoryUsage(): number | null {
    if (Platform.OS === 'ios') {
      try {
        const { PerformanceObserver } = require('react-native');
        // This is a placeholder - actual implementation would require native module
        return null;
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * Bundle size optimization checker
 */
export const bundleOptimization = {
  /**
   * Log bundle size in development
   */
  logBundleSize(): void {
    if (__DEV__) {
      console.log('📦 Check Metro bundler for bundle size');
      console.log('Run: npx react-native-bundle-visualizer');
    }
  },

  /**
   * Lazy load component
   */
  lazyLoad<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    const React = require('react');
    return React.lazy(factory);
  }
};

/**
 * Navigation performance utilities
 */
export const navigationOptimization = {
  /**
   * Freeze screen when not focused (react-navigation)
   */
  screenOptions: {
    freezeOnBlur: true,
    lazy: true,
    lazyPreloadDistance: 1,
  },

  /**
   * Optimize header performance
   */
  headerOptions: {
    headerBackTitleVisible: false,
    headerTruncatedBackTitle: '',
  }
};

/**
 * Animation performance utilities
 */
export const animationOptimization = {
  /**
   * Use native driver when possible
   */
  nativeDriverConfig: {
    useNativeDriver: true,
  },

  /**
   * Optimal spring configuration
   */
  springConfig: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /**
   * Optimal timing configuration
   */
  timingConfig: {
    duration: 300,
    useNativeDriver: true,
  }
};

/**
 * Context splitting utility to prevent unnecessary rerenders
 */
export function createSplitContext<T extends Record<string, any>>() {
  const React = require('react');
  const contexts: Record<string, React.Context<any>> = {};
  const providers: Record<string, React.Provider<any>> = {};

  return {
    create<K extends keyof T>(key: K, defaultValue: T[K]) {
      contexts[key as string] = React.createContext(defaultValue);
      providers[key as string] = contexts[key as string].Provider;
      return contexts[key as string];
    },

    use<K extends keyof T>(key: K): T[K] {
      const React = require('react');
      return React.useContext(contexts[key as string]);
    },

    Provider: ({ children, value }: { children: React.ReactNode; value: T }) => {
      const React = require('react');
      return Object.keys(value).reduce((tree, key) => {
        const Provider = providers[key];
        return <Provider value={value[key as keyof T]}>{tree}</Provider>;
      }, children);
    }
  };
}

/**
 * Performance tips logger
 */
export function logPerformanceTips(): void {
  if (!__DEV__) return;

  console.log(`
🚀 React Native Performance Tips:

1. Use React.memo() for expensive components
2. Use useCallback() for event handlers passed as props
3. Use useMemo() for expensive computations
4. Implement getItemLayout for FlatList
5. Use removeClippedSubviews on Android
6. Enable Hermes for faster startup
7. Use FastImage for better image performance
8. Implement pagination for long lists
9. Avoid anonymous functions in render
10. Split contexts to prevent unnecessary rerenders
11. Use InteractionManager for heavy tasks
12. Enable Flipper for performance profiling
13. Use React DevTools Profiler
14. Monitor bundle size regularly
15. Implement code splitting where possible

Run performanceMonitor.getSummary() to see metrics
  `);
}
