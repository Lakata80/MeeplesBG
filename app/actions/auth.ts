'use server'

import { signIn } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

type ФормаГрешки = {
  ime?: string[]
  email?: string[]
  парола?: string[]
  потвърдиПарола?: string[]
}

export type ФормаСтатус = {
  грешки?: ФормаГрешки
  съобщение?: string
} | undefined

// ──────────────────────────────────────────────
// Вход с имейл + парола
// ──────────────────────────────────────────────
export async function влизане(
  callbackUrl: string,
  _предишноСъстояние: ФормаСтатус,
  formData: FormData
): Promise<ФормаСтатус> {
  const email = formData.get('email') as string
  const парола = formData.get('парола') as string

  if (!email) return { грешки: { email: ['Полето е задължително'] } }
  if (!парола) return { грешки: { парола: ['Полето е задължително'] } }

  try {
    await signIn('credentials', {
      email,
      password: парола,
      redirectTo: callbackUrl || '/',
    })
  } catch (грешка) {
    if (грешка instanceof AuthError) {
      if (грешка.type === 'CredentialsSignin') {
        return { съобщение: 'Невалиден имейл или парола' }
      }
    }
    throw грешка
  }
}

// ──────────────────────────────────────────────
// Вход с Google
// ──────────────────────────────────────────────
export async function влизанеСGoogle(callbackUrl?: string) {
  await signIn('google', { redirectTo: callbackUrl || '/' })
}

// ──────────────────────────────────────────────
// Вход с Facebook
// ──────────────────────────────────────────────
export async function влизанеСFacebook(callbackUrl?: string) {
  await signIn('facebook', { redirectTo: callbackUrl || '/' })
}

// ──────────────────────────────────────────────
// Регистрация с имейл + парола
// ──────────────────────────────────────────────
export async function регистрация(
  callbackUrl: string,
  _предишноСъстояние: ФормаСтатус,
  formData: FormData
): Promise<ФормаСтатус> {
  const ime = (formData.get('ime') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const парола = formData.get('парола') as string
  const потвърдиПарола = formData.get('потвърдиПарола') as string

  const грешки: ФормаГрешки = {}

  if (!ime || ime.length < 2) {
    грешки.ime = ['Името трябва да е поне 2 символа']
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    грешки.email = ['Въведи валиден имейл адрес']
  }
  if (!парола || парола.length < 8) {
    грешки.парола = ['Паролата трябва да е поне 8 символа']
  }
  if (парола !== потвърдиПарола) {
    грешки.потвърдиПарола = ['Паролите не съвпадат']
  }

  if (Object.keys(грешки).length > 0) return { грешки }

  const съществуващПотребител = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (съществуващПотребител) {
    return { грешки: { email: ['Акаунтът вече съществува'] } }
  }

  const хешПарола = await bcrypt.hash(парола, 12)

  await prisma.user.create({
    data: {
      name: ime,
      email,
      passwordHash: хешПарола,
    },
  })

  await signIn('credentials', {
    email,
    password: парола,
    redirectTo: callbackUrl || '/',
  })
}
