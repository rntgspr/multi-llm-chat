/**
 * Session Store Implementation
 * Manages user sessions in Redis with automatic expiration
 */

import { loadRedisConfig } from '../../cache/config'
import { getRedisClient } from '../../cache/redis-client'

import type { SessionRecord, SessionStore, SessionStoreError } from './types'

/**
 * Redis-backed session store implementation
 */
export class RedisSessionStore implements SessionStore {
  private readonly keyPrefix = 'session:'
  private readonly defaultTtl: number

  constructor() {
    const config = loadRedisConfig()
    this.defaultTtl = config.sessionTtlSeconds
  }

  /**
   * Create a new session
   */
  async create(
    input: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'expiresAt'>,
    ttlSeconds?: number
  ): Promise<SessionRecord> {
    try {
      const now = new Date().toISOString()
      const ttl = ttlSeconds || this.defaultTtl
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

      const session: SessionRecord = {
        ...input,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      }

      const client = getRedisClient()
      const key = this.getKey(input.sessionId)
      const value = JSON.stringify(session)

      await client.setex(key, ttl, value)

      console.log(`[SessionStore] Created session ${input.sessionId} with TTL ${ttl}s`)

      return session
    } catch (error) {
      console.error('[SessionStore] Create error:', error)
      throw this.createError('REDIS_UNAVAILABLE', 'Failed to create session', error)
    }
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<SessionRecord | null> {
    try {
      const client = getRedisClient()
      const key = this.getKey(sessionId)
      const value = await client.get(key)

      if (!value) {
        return null
      }

      const session = JSON.parse(value) as SessionRecord

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        console.log(`[SessionStore] Session ${sessionId} expired`)
        await this.delete(sessionId)
        return null
      }

      return session
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('[SessionStore] Deserialization error:', error)
        throw this.createError('SERIALIZATION_ERROR', 'Failed to parse session data', error)
      }

      console.error('[SessionStore] Get error:', error)
      throw this.createError('REDIS_UNAVAILABLE', 'Failed to retrieve session', error)
    }
  }

  /**
   * Update a session
   */
  async update(
    sessionId: string,
    patch: Partial<Pick<SessionRecord, 'email' | 'name' | 'metadata'>>,
    ttlSeconds?: number
  ): Promise<SessionRecord | null> {
    try {
      const existingSession = await this.get(sessionId)

      if (!existingSession) {
        return null
      }

      const now = new Date().toISOString()
      const ttl = ttlSeconds || this.defaultTtl
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

      const updatedSession: SessionRecord = {
        ...existingSession,
        ...patch,
        updatedAt: now,
        expiresAt,
      }

      const client = getRedisClient()
      const key = this.getKey(sessionId)
      const value = JSON.stringify(updatedSession)

      await client.setex(key, ttl, value)

      console.log(`[SessionStore] Updated session ${sessionId} with TTL ${ttl}s`)

      return updatedSession
    } catch (error) {
      console.error('[SessionStore] Update error:', error)
      throw this.createError('REDIS_UNAVAILABLE', 'Failed to update session', error)
    }
  }

  /**
   * Delete a session (idempotent)
   */
  async delete(sessionId: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      const key = this.getKey(sessionId)
      const result = await client.del(key)

      const deleted = result > 0

      if (deleted) {
        console.log(`[SessionStore] Deleted session ${sessionId}`)
      }

      return deleted
    } catch (error) {
      console.error('[SessionStore] Delete error:', error)
      throw this.createError('REDIS_UNAVAILABLE', 'Failed to delete session', error)
    }
  }

  /**
   * Get the Redis key for a session
   */
  private getKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`
  }

  /**
   * Create a typed error
   */
  private createError(code: SessionStoreError['code'], message: string, cause?: unknown): SessionStoreError {
    return { code, message, cause }
  }
}
