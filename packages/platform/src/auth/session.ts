import type { UserId } from '@multi-llm/types'

/**
 * Session management placeholder.
 * TODO: Integrate with NextAuth or other auth provider.
 */

export interface Session {
  userId: UserId
  name: string
  email: string
  expiresAt: Date
}

const sessions = new Map<string, Session>()

/**
 * Gets a session by token
 */
export function getSession(token: string): Session | undefined {
  const session = sessions.get(token)
  if (session && session.expiresAt > new Date()) {
    return session
  }
  if (session) {
    sessions.delete(token)
  }
  return undefined
}

/**
 * Creates a new session
 */
export function createSession(userId: UserId, name: string, email: string, expiresInHours = 24): string {
  const token = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const session: Session = {
    userId,
    name,
    email,
    expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
  }
  sessions.set(token, session)
  return token
}

/**
 * Destroys a session
 */
export function destroySession(token: string): boolean {
  return sessions.delete(token)
}

/**
 * Cleans up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = new Date()
  let count = 0
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(token)
      count++
    }
  }
  return count
}
