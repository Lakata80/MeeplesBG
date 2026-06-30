export default function Зареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-6 bg-gray-200 rounded" />
            <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
