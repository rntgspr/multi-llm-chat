/**
 * Cache Client Implementation
 * Provides type-safe cache operations with Redis
 */

import { getRedisClient, healthCheck as redisHealthCheck } from './redis-client'

import type { CacheClient, CacheError, CacheSetOptions } from './types'

/**
 * Redis-backed cache client implementation
 */
export class RedisCacheClient implements CacheClient {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient()
      const value = await client.get(key)

      if (!value) {
        return null
      }

      try {
        return JSON.parse(value) as T
      } catch (error) {
        console.error('[CacheClient] Deserialization error:', error)
        throw this.createError('DESERIALIZATION_ERROR', `Failed to deserialize value for key: ${key}`, error)
      }
    } catch (error) {
      if ((error as CacheError).code === 'DESERIALIZATION_ERROR') {
        throw error
      }

      console.error('[CacheClient] Get error:', error)
      throw this.createError('REDIS_UNAVAILABLE', `Failed to get key: ${key}`, error)
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    try {
      let serializedValue: string

      try {
        serializedValue = JSON.stringify(value)
      } catch (error) {
        console.error('[CacheClient] Serialization error:', error)
        throw this.createError('SERIALIZATION_ERROR', `Failed to serialize value for key: ${key}`, error)
      }

      const client = getRedisClient()

      if (options?.ttlSeconds) {
        await client.setex(key, options.ttlSeconds, serializedValue)
        console.log(`[CacheClient] Set key ${key} with TTL ${options.ttlSeconds}s`)
      } else {
        await client.set(key, serializedValue)
        console.log(`[CacheClient] Set key ${key} (no TTL)`)
      }
    } catch (error) {
      if ((error as CacheError).code === 'SERIALIZATION_ERROR') {
        throw error
      }

      console.error('[CacheClient] Set error:', error)
      throw this.createError('REDIS_UNAVAILABLE', `Failed to set key: ${key}`, error)
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      const result = await client.del(key)

      const deleted = result > 0

      if (deleted) {
        console.log(`[CacheClient] Deleted key ${key}`)
      }

      return deleted
    } catch (error) {
      console.error('[CacheClient] Delete error:', error)
      throw this.createError('REDIS_UNAVAILABLE', `Failed to delete key: ${key}`, error)
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      const result = await client.exists(key)

      return result === 1
    } catch (error) {
      console.error('[CacheClient] Exists error:', error)
      throw this.createError('REDIS_UNAVAILABLE', `Failed to check existence of key: ${key}`, error)
    }
  }

  /**
   * Get the TTL for a key
   * Returns: -2 if key doesn't exist, -1 if no expiry, >= 0 for remaining seconds
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = getRedisClient()
      const ttl = await client.ttl(key)

      return ttl
    } catch (error) {
      console.error('[CacheClient] TTL error:', error)
      throw this.createError('REDIS_UNAVAILABLE', `Failed to get TTL for key: ${key}`, error)
    }
  }

  /**
   * Check Redis health
   */
  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    return redisHealthCheck()
  }

  /**
   * Create a typed error
   */
  private createError(code: CacheError['code'], message: string, cause?: unknown): CacheError {
    return { code, message, cause }
  }
}
