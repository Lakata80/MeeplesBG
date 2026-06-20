/**
 * Layout за административните страници на MeeplesBG
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Странична навигация */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <div className="font-bold text-lg mb-8">MeeplesBG Админ</div>
        <nav className="space-y-2">
          <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-800">
            Табло
          </a>
          <a href="/admin/igri" className="block px-3 py-2 rounded hover:bg-gray-800">
            Игри
          </a>
          <a href="/admin/potrebiteli" className="block px-3 py-2 rounded hover:bg-gray-800">
            Потребители
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
