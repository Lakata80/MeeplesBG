export default function ИгриЗареждане() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 shrink-0 space-y-6 animate-pulse">
          <div className="h-5 w-20 bg-gray-200 rounded" />
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              {[1, 2, 3].map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Results skeleton */}
        <div className="flex-1 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-9 w-36 bg-gray-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
