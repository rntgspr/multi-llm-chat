/**
 * Cache-related types and interfaces
 */

/**
 * Error type for cache operations
 */
export interface CacheError {
  code:
    | "REDIS_UNAVAILABLE"
    | "SERIALIZATION_ERROR"
    | "DESERIALIZATION_ERROR"
    | "VALIDATION_ERROR";
  message: string;
  cause?: unknown;
}

/**
 * Options for setting cache values
 */
export interface CacheSetOptions {
  ttlSeconds?: number;
}

/**
 * Cache client interface for type-safe cache operations
 */
export interface CacheClient {
  /**
   * Get a value from cache by key
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache (must be JSON-serializable)
   * @param options - Optional TTL configuration
   */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  /**
   * Delete a key from cache
   * @param key - Cache key
   * @returns true if key was deleted, false if key didn't exist
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns true if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get the time-to-live for a key
   * @param key - Cache key
   * @returns -2 if key doesn't exist, -1 if no expiry, >= 0 for remaining seconds
   */
  ttl(key: string): Promise<number>;

  /**
   * Check Redis health and measure latency
   * @returns Health status and latency in milliseconds
   */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>;
}
