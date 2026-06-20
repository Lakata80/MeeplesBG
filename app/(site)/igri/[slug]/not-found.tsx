import Link from 'next/link'

export default function GameNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">🎲</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Играта не беше намерена
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Тази игра не съществува в нашата база данни, или е временно деактивирана.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/igri"
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Разгледай всички игри
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-400 transition-colors"
          >
            Начална страница
          </Link>
        </div>
      </div>
    </div>
  )
}
