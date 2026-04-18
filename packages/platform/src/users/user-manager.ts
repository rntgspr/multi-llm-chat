import { userRepository } from '@synergy/db/repositories'

import type { User, UserId } from '@synergy/types'

/**
 * Creates a new user
 */
export async function createUser(name: string, email: string, avatarUrl?: string): Promise<User> {
  const user = await userRepository.create({
    name,
    email,
    avatar: avatarUrl,
  })
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
    createdAt: user.createdAt,
  }
}

/**
 * Gets a user by ID
 */
export async function getUser(userId: UserId): Promise<User | undefined> {
  const user = await userRepository.findById(userId)
  if (!user) return undefined

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
    createdAt: user.createdAt,
  }
}

/**
 * Gets a user by email
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const user = await userRepository.findByEmail(email)
  if (!user) return undefined

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
    createdAt: user.createdAt,
  }
}

/**
 * Updates a user
 */
export async function updateUser(
  userId: UserId,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | undefined> {
  try {
    const user = await userRepository.update(userId, {
      name: updates.name,
      email: updates.email,
      avatar: updates.avatarUrl,
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar,
      createdAt: user.createdAt,
    }
  } catch (_error) {
    // If user not found, return undefined
    return undefined
  }
}

/**
 * Deletes a user
 */
export async function deleteUser(userId: UserId): Promise<boolean> {
  try {
    await userRepository.delete(userId)
    return true
  } catch (_error) {
    return false
  }
}

/**
 * Lists all users
 */
export async function listUsers(): Promise<User[]> {
  const users = await userRepository.findAll()
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
    createdAt: user.createdAt,
  }))
}

/**
 * Gets or creates a user by email
 */
export async function getOrCreateUser(email: string, name: string, avatarUrl?: string): Promise<User> {
  const existing = await getUserByEmail(email)
  if (existing) return existing
  return createUser(name, email, avatarUrl)
}
