export default function GameLoading() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 py-3">
        <div className="container mx-auto px-4 flex gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <span className="text-gray-300">/</span>
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <span className="text-gray-300">/</span>
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Hero */}
      <div className="py-8 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Снимка */}
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="aspect-square bg-gray-200 rounded-2xl" />
            </div>
            {/* Информация */}
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-20 bg-gray-200 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl" />
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-32 bg-gray-200 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-8 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + i * 7}%` }} />
          ))}
        </div>
      </div>

      {/* Comments skeleton */}
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-6 w-40 bg-gray-200 rounded-lg mb-6" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-4/5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
