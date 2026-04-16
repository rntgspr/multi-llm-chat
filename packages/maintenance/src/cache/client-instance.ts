/**
 * Singleton cache client instance
 * Provides a single shared instance across the application
 */

import { RedisCacheClient } from "./operations.js";

/**
 * Singleton cache client instance
 */
let cacheClientInstance: RedisCacheClient | null = null;

/**
 * Get the singleton cache client instance
 * @returns Shared cache client instance
 */
export function getCacheClient(): RedisCacheClient {
  if (!cacheClientInstance) {
    cacheClientInstance = new RedisCacheClient();
    console.log("[CacheClient] Singleton instance created");
  }

  return cacheClientInstance;
}

/**
 * Export default singleton for convenience
 */
export const cacheClient = getCacheClient();
