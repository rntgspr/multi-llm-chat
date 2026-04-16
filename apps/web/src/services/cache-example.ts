/**
 * Cache Client Usage Example
 * Demonstrates how to use the Redis cache client
 */

import { getCacheClient } from "@multi-llm/maintenance";

/**
 * Example: Cache user preferences
 */
export async function cacheUserPreferences(
  userId: string,
  preferences: Record<string, unknown>,
): Promise<void> {
  const cache = getCacheClient();

  await cache.set(
    `user:${userId}:preferences`,
    preferences,
    { ttlSeconds: 3600 }, // 1 hour TTL
  );

  console.log(`Cached preferences for user ${userId}`);
}

/**
 * Example: Get cached user preferences
 */
export async function getCachedUserPreferences(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const cache = getCacheClient();

  const preferences = await cache.get<Record<string, unknown>>(
    `user:${userId}:preferences`,
  );

  if (preferences) {
    console.log(`Found cached preferences for user ${userId}`);
  } else {
    console.log(`No cached preferences for user ${userId}`);
  }

  return preferences;
}

/**
 * Example: Cache API response
 */
export async function cacheApiResponse(
  endpoint: string,
  data: unknown,
  ttlSeconds: number = 300,
): Promise<void> {
  const cache = getCacheClient();
  const key = `api:${endpoint}`;

  await cache.set(key, data, { ttlSeconds });

  console.log(`Cached API response for ${endpoint} (TTL: ${ttlSeconds}s)`);
}

/**
 * Example: Get cached API response
 */
export async function getCachedApiResponse<T>(
  endpoint: string,
): Promise<T | null> {
  const cache = getCacheClient();
  const key = `api:${endpoint}`;

  const data = await cache.get<T>(key);

  if (data) {
    const ttl = await cache.ttl(key);
    console.log(`Cache hit for ${endpoint} (TTL: ${ttl}s remaining)`);
  }

  return data;
}

/**
 * Example: Invalidate cache
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const cache = getCacheClient();

  // For this example, we'll delete a specific key
  // In production, you might want to use Redis SCAN for pattern matching
  const deleted = await cache.delete(pattern);

  if (deleted) {
    console.log(`Invalidated cache: ${pattern}`);
  }
}

/**
 * Example: Check cache health
 */
export async function checkCacheHealth(): Promise<boolean> {
  const cache = getCacheClient();

  const health = await cache.healthCheck();

  console.log(
    `Cache health: ${health.ok ? "OK" : "FAILED"} (latency: ${health.latencyMs}ms)`,
  );

  return health.ok && health.latencyMs < 50;
}
