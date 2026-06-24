'use client'

import { useRouter } from 'next/navigation'
import NewThreadForm from '@/components/obshtnost/NewThreadForm'
import { type ThreadCategorySlug } from '@/lib/obshtnost'

export default function NewThreadFormWrapper({ categorySlug }: { categorySlug: ThreadCategorySlug }) {
  const router = useRouter()
  return (
    <NewThreadForm
      categorySlug={categorySlug}
      onCancel={() => router.push(`/obshtnost/${categorySlug}`)}
    />
  )
}
