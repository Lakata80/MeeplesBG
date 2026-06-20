'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function добавиКоментар(
  gameId: string,
  slug: string,
  content: string,
  parentId?: string
): Promise<{ успех?: true; грешка?: string }> {
  const сесия = await auth()
  if (!сесия?.user?.id) {
    return { грешка: 'Трябва да влезеш в акаунта си, за да коментираш.' }
  }

  const текст = content.trim()
  if (текст.length < 3) return { грешка: 'Коментарът е твърде кратък (мин. 3 символа).' }
  if (текст.length > 2000) return { грешка: 'Коментарът е твърде дълъг (макс. 2000 символа).' }

  // Верифицирай, че играта съществува
  const играСъщ = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } })
  if (!играСъщ) return { грешка: 'Играта не беше намерена.' }

  // Ако е reply, верифицирай родителя
  if (parentId) {
    const родител = await prisma.comment.findUnique({ where: { id: parentId }, select: { parentId: true } })
    if (!родител) return { грешка: 'Родителският коментар не съществува.' }
    if (родител.parentId) return { грешка: 'Отговори на отговори не са позволени.' }
  }

  try {
    await prisma.comment.create({
      data: {
        userId:   сесия.user.id,
        gameId,
        content:  текст,
        parentId: parentId ?? null,
      },
    })
    revalidatePath(`/igri/${slug}`)
    return { успех: true }
  } catch {
    return { грешка: 'Грешка при запис. Опитай отново.' }
  }
}
