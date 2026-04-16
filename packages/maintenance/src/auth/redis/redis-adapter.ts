/**
 * NextAuth Redis Adapter
 * Connects NextAuth to Redis session storage
 */

import type { Adapter, AdapterSession, AdapterUser } from "@auth/core/adapters";
import { RedisSessionStore } from "./session-store.js";
import type { SessionRecord } from "./types.js";

/**
 * Create a Redis adapter for NextAuth
 * @returns NextAuth adapter configured for Redis
 */
export function RedisAdapter(): Adapter {
  const sessionStore = new RedisSessionStore();

  return {
    // User methods - We'll use a minimal implementation since we're using JWT + session store
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      // Generate a simple user ID (in production, this should come from your user service)
      const id = crypto.randomUUID();
      return { ...user, id };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      // In this implementation, user data is managed elsewhere
      // This is called rarely since we use JWT strategy
      return null;
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      // User lookup is handled by the auth provider
      return null;
    },

    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      return null;
    },

    async updateUser(user: Partial<AdapterUser>): Promise<AdapterUser> {
      // User updates are handled by the user service
      return user as AdapterUser;
    },

    async deleteUser(userId: string): Promise<void> {
      // User deletion is handled by the user service
    },

    // Session methods - This is where Redis integration happens
    async createSession(
      session: {
        sessionToken: string;
        userId: string;
        expires: Date;
      },
    ): Promise<AdapterSession> {
      const ttlSeconds = Math.floor(
        (session.expires.getTime() - Date.now()) / 1000,
      );

      await sessionStore.create(
        {
          sessionId: session.sessionToken,
          userId: session.userId,
          email: "", // Will be populated in callback
        },
        ttlSeconds,
      );

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async getSessionAndUser(
      sessionToken: string,
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const sessionRecord = await sessionStore.get(sessionToken);

      if (!sessionRecord) {
        return null;
      }

      return {
        session: {
          sessionToken: sessionRecord.sessionId,
          userId: sessionRecord.userId,
          expires: new Date(sessionRecord.expiresAt),
        },
        user: {
          id: sessionRecord.userId,
          email: sessionRecord.email,
          name: sessionRecord.name,
          emailVerified: null,
        },
      };
    },

    async updateSession(
      session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
    ): Promise<AdapterSession | null | undefined> {
      if (!session.sessionToken) {
        return null;
      }

      const ttlSeconds = session.expires
        ? Math.floor((session.expires.getTime() - Date.now()) / 1000)
        : undefined;

      const updated = await sessionStore.update(
        session.sessionToken,
        {},
        ttlSeconds,
      );

      if (!updated) {
        return null;
      }

      return {
        sessionToken: updated.sessionId,
        userId: updated.userId,
        expires: new Date(updated.expiresAt),
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await sessionStore.delete(sessionToken);
    },

    // Account methods - Not used with JWT strategy
    async linkAccount(account: any): Promise<void> {
      // Not implemented for JWT strategy
    },

    async unlinkAccount({
      providerAccountId,
      provider,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<void> {
      // Not implemented for JWT strategy
    },

    // Verification token methods - Not used with JWT strategy
    async createVerificationToken(token: any): Promise<any> {
      return token;
    },

    async useVerificationToken(params: any): Promise<any> {
      return null;
    },
  };
}
