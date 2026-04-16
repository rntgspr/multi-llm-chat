/**
 * Redis configuration loader
 * Reads environment variables, validates, and provides defaults
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  sessionTtlSeconds: number;
}

/**
 * Load Redis configuration from environment variables
 * @returns Redis configuration object
 * @throws Error if required variables are missing or invalid
 */
export function loadRedisConfig(): RedisConfig {
  const host = process.env.REDIS_HOST || "localhost";
  const port = Number.parseInt(process.env.REDIS_PORT || "6379", 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = Number.parseInt(process.env.REDIS_DB || "0", 10);
  const sessionTtlSeconds = Number.parseInt(
    process.env.REDIS_SESSION_TTL_SECONDS || "2592000", // 30 days default
    10,
  );

  // Validate port
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid REDIS_PORT: ${process.env.REDIS_PORT}. Must be between 1 and 65535.`,
    );
  }

  // Validate db
  if (Number.isNaN(db) || db < 0 || db > 15) {
    throw new Error(
      `Invalid REDIS_DB: ${process.env.REDIS_DB}. Must be between 0 and 15.`,
    );
  }

  // Validate session TTL
  if (Number.isNaN(sessionTtlSeconds) || sessionTtlSeconds < 1) {
    throw new Error(
      `Invalid REDIS_SESSION_TTL_SECONDS: ${process.env.REDIS_SESSION_TTL_SECONDS}. Must be a positive integer.`,
    );
  }

  return {
    host,
    port,
    password,
    db,
    sessionTtlSeconds,
  };
}
