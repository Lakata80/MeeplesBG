import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Имейл', type: 'email' },
        password: { label: 'Парола', type: 'password' },
      },
      async authorize(credentials, _request) {
        if (!credentials?.email || !credentials?.password) return null

        const потребител = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            bggUsername: true,
            passwordHash: true,
          },
        })

        if (!потребител?.passwordHash) return null

        const паролаВалидна = await bcrypt.compare(
          credentials.password as string,
          потребител.passwordHash
        )

        if (!паролаВалидна) return null

        return {
          id:          потребител.id,
          email:       потребител.email ?? undefined,
          name:        потребител.name ?? undefined,
          image:       потребител.image ?? undefined,
          role:        потребител.role as string,
          bggUsername: потребител.bggUsername ?? undefined,
        }
      },
    }),
  ],
})
