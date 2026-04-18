import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Add user ID and image to token on first sign in
      if (account && profile) {
        token.sub = token.sub || account.providerAccountId
        token.picture = (profile as any).picture || token.picture
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID and image from token to session
      if (session.user && token) {
        session.user.id = token.sub as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: true, // Enable debug mode
})
