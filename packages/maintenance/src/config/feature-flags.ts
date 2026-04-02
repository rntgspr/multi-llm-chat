import type { UserId } from '@multi-llm/types'

interface FeatureFlagsConfig {
  debugUsers: UserId[]
  globalDebugMode: boolean
}

const config: FeatureFlagsConfig = {
  debugUsers: [],
  globalDebugMode: process.env.NODE_ENV === 'development',
}

/**
 * Checks if a user has debug mode enabled
 */
export function isDebugMode(userId: UserId): boolean {
  return config.globalDebugMode || config.debugUsers.includes(userId)
}

/**
 * Checks if a user can see navigator decisions in the chat
 */
export function canSeeNavigatorDecisions(userId: UserId): boolean {
  return isDebugMode(userId)
}

/**
 * Adds a user to the debug users list
 */
export function enableDebugForUser(userId: UserId): void {
  if (!config.debugUsers.includes(userId)) {
    config.debugUsers.push(userId)
  }
}

/**
 * Removes a user from the debug users list
 */
export function disableDebugForUser(userId: UserId): void {
  config.debugUsers = config.debugUsers.filter((id) => id !== userId)
}

/**
 * Sets global debug mode
 */
export function setGlobalDebugMode(enabled: boolean): void {
  config.globalDebugMode = enabled
}

/**
 * Gets current feature flags config
 */
export function getConfig(): FeatureFlagsConfig {
  return { ...config }
}
