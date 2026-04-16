/**
 * Base Redis client factory
 * Provides connection management, error handling, and singleton pattern
 */

import Redis from "ioredis";
import type { RedisConfig } from "./config.js";
import { loadRedisConfig } from "./config.js";

/**
 * Singleton Redis client instance
 */
let redisClient: Redis | null = null;

/**
 * Create or get the singleton Redis client
 * @param config - Optional Redis configuration (uses env vars if not provided)
 * @returns Redis client instance
 */
export function getRedisClient(config?: RedisConfig): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = config || loadRedisConfig();

  redisClient = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    retryStrategy: (times: number) => {
      // Retry with exponential backoff up to 3 seconds
      const delay = Math.min(times * 50, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  // Log connection events
  redisClient.on("connect", () => {
    console.log(
      `[Redis] Connected to ${redisConfig.host}:${redisConfig.port}`,
    );
  });

  redisClient.on("ready", () => {
    console.log("[Redis] Client ready");
  });

  redisClient.on("error", (error: Error) => {
    console.error("[Redis] Connection error:", error);
  });

  redisClient.on("close", () => {
    console.log("[Redis] Connection closed");
  });

  redisClient.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  return redisClient;
}

/**
 * Health check for Redis connection
 * @returns Health status and latency
 */
export async function healthCheck(): Promise<{
  ok: boolean;
  latencyMs: number;
}> {
  const client = getRedisClient();
  const startTime = Date.now();

  try {
    const result = await client.ping();
    const latencyMs = Date.now() - startTime;

    return {
      ok: result === "PONG",
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("[Redis] Health check failed:", error);

    return {
      ok: false,
      latencyMs,
    };
  }
}

/**
 * Gracefully disconnect the Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Client disconnected");
  }
}
