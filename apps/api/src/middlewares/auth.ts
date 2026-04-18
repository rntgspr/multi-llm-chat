import * as jose from 'jose'
import { logger } from '../lib/logger.js'

/**
 * JWT payload structure from NextAuth
 */
export interface JWTPayload {
  sub: string // User ID
  name?: string
  email?: string
  picture?: string
  iat?: number
  exp?: number
  jti?: string
}

/**
 * Verify JWT token using NextAuth secret
 * @param token - JWT token string
 * @returns Decoded payload if valid, null if invalid
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) {
    logger.error('NEXTAUTH_SECRET environment variable is not set')
    return null
  }

  try {
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: ['HS256'], // NextAuth uses HS256 by default
    })

    return payload as JWTPayload
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      logger.warn({ error: 'JWT expired' }, 'Token validation failed')
    } else if (error instanceof jose.errors.JWTInvalid) {
      logger.warn({ error: 'JWT invalid' }, 'Token validation failed')
    } else {
      logger.error({ error }, 'Unexpected JWT verification error')
    }
    return null
  }
}

/**
 * Extract token from socket handshake
 * Checks auth.token first, then query.token
 */
export function extractTokenFromSocket(
  handshake: {
    auth?: { token?: string }
    query?: { token?: string }
  },
): string | null {
  return handshake.auth?.token || (handshake.query?.token as string) || null
}
