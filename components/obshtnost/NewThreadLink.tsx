'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  categorySlug: string
  label: string
}

export default function NewThreadLink({ categorySlug, label }: Props) {
  const { status } = useSession()

  if (status === 'loading') return null

  if (status === 'authenticated') {
    return (
      <Link
        href={`/obshtnost/${categorySlug}?new=1`}
        className="shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
      >
        + {label}
      </Link>
    )
  }

  return (
    <Link href="/login" className="shrink-0 text-sm text-brand-600 font-medium hover:underline">
      Влез за да публикуваш
    </Link>
  )
}
