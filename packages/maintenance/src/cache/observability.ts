/**
 * Observability Hooks for Redis Operations
 * Provides hooks for metrics collection and monitoring
 */

export interface OperationMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
}

export type MetricsCallback = (metrics: OperationMetrics) => void;

let metricsCallback: MetricsCallback | null = null;

/**
 * Register a metrics callback
 */
export function registerMetricsCallback(callback: MetricsCallback): void {
  metricsCallback = callback;
  console.log("[Observability] Metrics callback registered");
}

/**
 * Record an operation metric
 */
export function recordMetric(metrics: OperationMetrics): void {
  if (metricsCallback) {
    try {
      metricsCallback(metrics);
    } catch (error) {
      console.error("[Observability] Error in metrics callback:", error);
    }
  }
}

/**
 * Measure operation duration
 */
export async function measureOperation<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await fn();
    success = true;
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - startTime;

    recordMetric({
      operation,
      duration,
      success,
      error,
    });
  }
}
