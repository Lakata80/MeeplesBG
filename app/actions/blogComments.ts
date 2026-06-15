'use server'

import { auth }           from '@/auth'
import { prisma }         from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type БлогКоментарРезултат = { успех: true } | { грешка: string }

export async function добавиКоментарКъмСтатия(
  postSlug: string,
  content:  string,
  parentId?: string,
): Promise<БлогКоментарРезултат> {
  const session = await auth()
  if (!session?.user?.id) {
    return { грешка: 'Трябва да влезете в профила си, за да коментирате.' }
  }

  const trimmed = content.trim()
  if (trimmed.length < 3) {
    return { грешка: 'Коментарът трябва да е поне 3 символа.' }
  }
  if (trimmed.length > 2000) {
    return { грешка: 'Коментарът не може да е по-дълъг от 2 000 символа.' }
  }

  if (parentId) {
    const родител = await prisma.blogComment.findUnique({
      where:  { id: parentId },
      select: { parentId: true },
    })
    if (родител?.parentId) {
      return { грешка: 'Не може да отговаряте на отговор.' }
    }
  }

  await prisma.blogComment.create({
    data: {
      userId:   session.user.id,
      postSlug,
      content:  trimmed,
      parentId: parentId ?? null,
    },
  })

  revalidatePath(`/novini/${postSlug}`)
  return { успех: true }
}
