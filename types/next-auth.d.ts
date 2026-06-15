import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      bggUsername?: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
    bggUsername?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    bggUsername?: string
  }
}
