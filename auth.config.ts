import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role        = (user as { role?: string }).role ?? 'USER'
        token.bggUsername = (user as { bggUsername?: string }).bggUsername
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id          = token.sub!
        session.user.role        = token.role as string
        session.user.bggUsername = token.bggUsername as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
} satisfies NextAuthConfig
