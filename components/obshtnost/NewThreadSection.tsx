'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NewThreadForm from '@/components/obshtnost/NewThreadForm'
import { type ThreadCategorySlug } from '@/lib/obshtnost'

interface Props {
  categorySlug: ThreadCategorySlug
  label: string
  initialOpen?: boolean
}

export default function NewThreadSection({ categorySlug, label, initialOpen = false }: Props) {
  const { status } = useSession()
  const router = useRouter()
  const [showForm, setShowForm] = useState(initialOpen)

  if (status === 'loading') return null

  if (status === 'unauthenticated') {
    return (
      <Link href="/login" className="shrink-0 text-sm text-brand-600 font-medium hover:underline">
        Влез за да публикуваш
      </Link>
    )
  }

  if (showForm) {
    return (
      <div className="mb-10">
        <NewThreadForm
          categorySlug={categorySlug}
          onCancel={() => {
            setShowForm(false)
            router.replace(`/obshtnost/${categorySlug}`)
          }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
    >
      + {label}
    </button>
  )
}
