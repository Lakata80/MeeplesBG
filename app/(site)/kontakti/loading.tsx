export default function Зареждане() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse max-w-2xl">
      <div className="h-8 w-40 bg-gray-200 rounded-lg mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl w-40" />
      </div>
    </div>
  )
}
