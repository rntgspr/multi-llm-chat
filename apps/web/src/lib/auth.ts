import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { RedisAdapter } from '@multi-llm/maintenance'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: RedisAdapter(),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      // Ensure session contains userId and email
      if (session.user) {
        session.user.id = user?.id || session.user.id
        session.user.email = user?.email || session.user.email
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
