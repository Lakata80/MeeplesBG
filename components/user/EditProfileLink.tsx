'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  targetUserId: string
}

export default function EditProfileLink({ targetUserId }: Props) {
  const { data: session, status } = useSession()

  if (status === 'loading') return null
  if (session?.user?.id !== targetUserId) return null

  return (
    <Link
      href="/profil"
      className="shrink-0 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      ✏️ Редактирай профила
    </Link>
  )
}
