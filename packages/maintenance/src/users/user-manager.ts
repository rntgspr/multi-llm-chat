import type { User, UserId } from '@multi-llm/types'

const users = new Map<UserId, User>()

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Creates a new user
 */
export function createUser(name: string, email: string, avatarUrl?: string): User {
  const user: User = {
    id: generateId(),
    name,
    email,
    avatarUrl,
    createdAt: new Date(),
  }
  users.set(user.id, user)
  return user
}

/**
 * Gets a user by ID
 */
export function getUser(userId: UserId): User | undefined {
  return users.get(userId)
}

/**
 * Gets a user by email
 */
export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((u) => u.email === email)
}

/**
 * Updates a user
 */
export function updateUser(userId: UserId, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
  const user = users.get(userId)
  if (!user) return undefined

  Object.assign(user, updates)
  return user
}

/**
 * Deletes a user
 */
export function deleteUser(userId: UserId): boolean {
  return users.delete(userId)
}

/**
 * Lists all users
 */
export function listUsers(): User[] {
  return Array.from(users.values())
}

/**
 * Gets or creates a user by email
 */
export function getOrCreateUser(email: string, name: string, avatarUrl?: string): User {
  const existing = getUserByEmail(email)
  if (existing) return existing
  return createUser(name, email, avatarUrl)
}
