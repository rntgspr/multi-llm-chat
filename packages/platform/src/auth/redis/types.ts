/**
 * Session store types and interfaces
 */

/**
 * Session record stored in Redis
 */
export interface SessionRecord {
  sessionId: string
  userId: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  metadata?: Record<string, unknown>
}

/**
 * Error type for session store operations
 */
export interface SessionStoreError {
  code: 'REDIS_UNAVAILABLE' | 'SERIALIZATION_ERROR' | 'NOT_FOUND' | 'VALIDATION_ERROR'
  message: string
  cause?: unknown
}

/**
 * Session store interface for managing user sessions
 */
export interface SessionStore {
  /**
   * Create a new session
   * @param input - Session data (without timestamps)
   * @param ttlSeconds - Optional TTL (defaults to 30 days)
   * @returns The created session record
   */
  create(
    input: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'expiresAt'>,
    ttlSeconds?: number
  ): Promise<SessionRecord>

  /**
   * Get a session by ID
   * @param sessionId - Session identifier
   * @returns The session record or null if not found/expired
   */
  get(sessionId: string): Promise<SessionRecord | null>

  /**
   * Update a session
   * @param sessionId - Session identifier
   * @param patch - Fields to update
   * @param ttlSeconds - Optional new TTL
   * @returns The updated session record or null if not found
   */
  update(
    sessionId: string,
    patch: Partial<Pick<SessionRecord, 'email' | 'name' | 'metadata'>>,
    ttlSeconds?: number
  ): Promise<SessionRecord | null>

  /**
   * Delete a session (logout)
   * @param sessionId - Session identifier
   * @returns true if session was deleted, false if it didn't exist
   */
  delete(sessionId: string): Promise<boolean>
}
