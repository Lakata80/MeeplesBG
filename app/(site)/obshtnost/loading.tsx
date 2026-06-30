export default function Зареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-44 bg-gray-200 rounded-lg mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
