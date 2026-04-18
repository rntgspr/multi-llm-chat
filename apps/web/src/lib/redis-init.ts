/**
 * Redis Initialization for Web App
 * Establishes Redis connections and performs health check on startup
 */

import { healthCheck } from '@synergy/platform'

let isInitialized = false

/**
 * Initialize Redis connections
 * Throws if Redis is unavailable (fail-fast)
 */
export async function initializeRedis(): Promise<void> {
  if (isInitialized) {
    return
  }

  try {
    console.log('[Redis] Initializing connections...')

    // Perform health check
    const health = await healthCheck()

    if (!health.ok) {
      throw new Error(`Redis health check failed (latency: ${health.latencyMs}ms)`)
    }

    if (health.latencyMs > 50) {
      console.warn(`[Redis] Warning: High latency detected (${health.latencyMs}ms)`)
    }

    console.log(`[Redis] Initialized successfully (latency: ${health.latencyMs}ms)`)
    isInitialized = true
  } catch (error) {
    console.error('[Redis] FATAL: Failed to initialize Redis:', error)
    throw error
  }
}

/**
 * Check if Redis is initialized
 */
export function isRedisInitialized(): boolean {
  return isInitialized
}
