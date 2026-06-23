import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Администрация — MeeplesBG' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') redirect('/')

  const чакащиСнимки = await prisma.pendingImage.count({ where: { status: 'PENDING' } })
  const общоИгри     = await prisma.game.count()
  const общоПотр     = await prisma.user.count()

  const секции = [
    {
      href:    '/admin/pending-images',
      label:   'Снимки за одобрение',
      desc:    'Преглед и одобрение на снимки от потребители',
      badge:   чакащиСнимки > 0 ? чакащиСнимки : null,
      icon:    '🖼️',
    },
    {
      href:    '/admin/games',
      label:   'Игри',
      desc:    `${общоИгри} игри в базата — редакция на описания и типове`,
      badge:   null,
      icon:    '🎲',
    },
    {
      href:    '/admin/users',
      label:   'Потребители',
      desc:    `${общоПотр} потребители — управление на роли`,
      badge:   null,
      icon:    '👤',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-800 mb-2">Администрация</h1>
      <p className="text-gray-400 mb-8">Управление на MeeplesBG</p>

      <div className="grid gap-4">
        {секции.map((с) => (
          <Link
            key={с.href}
            href={с.href}
            className="group flex items-center gap-4 bg-white border border-[var(--border)] rounded-2xl px-6 py-5 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <span className="text-3xl">{с.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-800 group-hover:text-brand-600 transition-colors">
                  {с.label}
                </span>
                {с.badge !== null && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {с.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{с.desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-brand-400 transition-colors text-xl">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
