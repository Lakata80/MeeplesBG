export default function Зареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse max-w-3xl">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
