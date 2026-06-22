export default function Зареждане() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-72 bg-brand-100" />

      {/* Hotness skeleton */}
      <div className="py-12 bg-orange-50/60">
        <div className="container mx-auto px-4">
          <div className="h-7 w-52 bg-gray-200 rounded-lg mb-6" />
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 space-y-2">
                <div className="aspect-square bg-gray-200 rounded-xl" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bestsellers skeleton */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="h-7 w-44 bg-gray-200 rounded-lg mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Releases skeleton */}
      <div className="py-12 bg-brand-50/40">
        <div className="container mx-auto px-4">
          <div className="h-7 w-48 bg-gray-200 rounded-lg mb-6" />
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 space-y-2">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News skeleton */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="h-7 w-32 bg-gray-200 rounded-lg mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
