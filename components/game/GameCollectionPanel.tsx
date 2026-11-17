'use client'

import { useEffect, useState } from 'react'
import { useSession }          from 'next-auth/react'
import { CollectionStatus }    from '@prisma/client'
import CollectionButtons       from '@/components/game/CollectionButtons'
import ImageUploadButton       from '@/components/game/ImageUploadButton'

interface Props {
  gameId: string
  slug:   string
}

export default function GameCollectionPanel({ gameId, slug }: Props) {
  const { data: session, status }              = useSession()
  const [колекцияСтатус, setКолекцияСтатус]   = useState<CollectionStatus | null>(null)
  const [зареден, setЗареден]                  = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setЗареден(true)
      return
    }
    fetch(`/api/user/game-status?gameId=${gameId}`)
      .then((r) => r.json())
      .then((data) => {
        setКолекцияСтатус(data.collectionStatus ?? null)
        setЗареден(true)
      })
      .catch(() => setЗареден(true))
  }, [gameId, status])

  const влязъл = status === 'authenticated'

  return (
    <>
      {/* Бутони за качване снимка — само за логнати */}
      {влязъл && <ImageUploadButton slug={slug} />}

      {/* Бутони за колекция */}
      <div className="flex flex-wrap gap-2 mb-3 mt-3">
        <CollectionButtons
          gameId={gameId}
          slug={slug}
          текущСтатус={зареден ? колекцияСтатус : null}
          влязъл={влязъл && зареден}
        />
      </div>
    </>
  )
}
