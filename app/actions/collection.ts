'use server'

import { revalidatePath } from 'next/cache'
import { CollectionStatus } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function добавиВКолекция(
  gameId: string,
  slug: string,
  статус: CollectionStatus
): Promise<{ успех?: true; грешка?: string }> {
  const сесия = await auth()
  if (!сесия?.user?.id) {
    return { грешка: 'Трябва да влезеш в акаунта си.' }
  }

  try {
    await prisma.userCollection.upsert({
      where:  { userId_gameId: { userId: сесия.user.id, gameId } },
      update: { status: статус },
      create: { userId: сесия.user.id, gameId, status: статус },
    })
    revalidatePath(`/igri/${slug}`)
    return { успех: true }
  } catch {
    return { грешка: 'Грешка при запис. Опитай отново.' }
  }
}

export async function премахниОтКолекция(
  gameId: string,
  slug: string
): Promise<{ успех?: true; грешка?: string }> {
  const сесия = await auth()
  if (!сесия?.user?.id) {
    return { грешка: 'Трябва да влезеш в акаунта си.' }
  }

  try {
    await prisma.userCollection.deleteMany({
      where: { userId: сесия.user.id, gameId },
    })
    revalidatePath(`/igri/${slug}`)
    return { успех: true }
  } catch {
    return { грешка: 'Грешка при изтриване. Опитай отново.' }
  }
}
