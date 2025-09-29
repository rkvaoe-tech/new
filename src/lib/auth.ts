import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { User } from '@/types'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.appUser.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Проверяем хешированный пароль
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          return null
        }

        // Обновляем lastLoginAt
        await prisma.appUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          displayName: user.displayName,
          role: user.role as 'USER' | 'ADMIN',
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role as 'USER' | 'ADMIN'
        token.displayName = (user as any).displayName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Получаем актуальные данные пользователя из базы
        const user = await prisma.appUser.findUnique({
          where: { id: token.sub! },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          }
        })

        if (user) {
          session.user.id = user.id
          session.user.email = user.email
          session.user.name = user.displayName || ''
          session.user.displayName = user.displayName || ''
          session.user.role = user.role as 'USER' | 'ADMIN'
        }
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      displayName: string
      role: 'USER' | 'ADMIN'
    }
  }

  interface User {
    displayName: string
    role: 'USER' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'USER' | 'ADMIN'
    displayName: string
  }
}
