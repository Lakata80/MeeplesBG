interface YouTubeVideo {
  id: string
  title: string
}

async function fetchVideos(заглавие: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    const query = encodeURIComponent(`${заглавие} board game how to play`)
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${query}&type=video&maxResults=3&key=${apiKey}`

    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []

    const data = (await res.json()) as {
      items?: { id: { videoId: string }; snippet: { title: string } }[]
    }

    return (data.items ?? []).map((item) => ({
      id:    item.id.videoId,
      title: item.snippet.title,
    }))
  } catch {
    return []
  }
}

export default async function YouTubeSection({ заглавие }: { заглавие: string }) {
  const видеа = await fetchVideos(заглавие)
  if (видеа.length === 0) return null

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎬 Видео уроци</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {видеа.map((видео) => (
            <div key={видео.id} className="rounded-xl overflow-hidden bg-black aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${видео.id}`}
                title={видео.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
