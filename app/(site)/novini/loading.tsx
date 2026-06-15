export default function НовиниЗареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      {/* Заглавие */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-100 rounded" />
      </div>

      {/* Табове */}
      <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4">
        {[80, 72, 60, 56, 100].map((w, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Мрежа */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="aspect-video bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 w-32 bg-gray-100 rounded mt-4 pt-4 border-t border-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
