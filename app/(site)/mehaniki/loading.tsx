export default function Зареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded-lg mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
