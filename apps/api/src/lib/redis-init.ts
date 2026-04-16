/**
 * Redis Initialization for API Service
 * Establishes Redis connections and starts event subscribers on startup
 */

import { healthCheck, getSubscriber } from "@multi-llm/maintenance";
import { subscribeToAllEvents } from "../subscribers/event-subscriber.js";

let isInitialized = false;
let unsubscribeAll: (() => void) | null = null;

/**
 * Initialize Redis connections and subscribers
 * Throws if Redis is unavailable (fail-fast)
 */
export async function initializeRedis(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log("[Redis] Initializing connections...");

    // Perform health check
    const health = await healthCheck();

    if (!health.ok) {
      throw new Error(
        `Redis health check failed (latency: ${health.latencyMs}ms)`,
      );
    }

    if (health.latencyMs > 50) {
      console.warn(
        `[Redis] Warning: High latency detected (${health.latencyMs}ms)`,
      );
    }

    console.log(`[Redis] Initialized successfully (latency: ${health.latencyMs}ms)`);

    // Start event subscribers
    console.log("[Redis] Starting event subscribers...");
    unsubscribeAll = await subscribeToAllEvents();

    isInitialized = true;
  } catch (error) {
    console.error("[Redis] FATAL: Failed to initialize Redis:", error);
    throw error;
  }
}

/**
 * Gracefully shutdown Redis connections
 */
export async function shutdownRedis(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  try {
    console.log("[Redis] Shutting down...");

    // Unsubscribe from all events
    if (unsubscribeAll) {
      await unsubscribeAll();
      unsubscribeAll = null;
    }

    // Disconnect subscriber
    const subscriber = getSubscriber();
    await subscriber.disconnect();

    console.log("[Redis] Shutdown complete");
    isInitialized = false;
  } catch (error) {
    console.error("[Redis] Error during shutdown:", error);
  }
}

/**
 * Check if Redis is initialized
 */
export function isRedisInitialized(): boolean {
  return isInitialized;
}
