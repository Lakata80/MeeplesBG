import Link from 'next/link'

const СЛУЧАИ = [
  {
    emoji: '👨‍👩‍👧‍👦',
    label: 'Семейство',
    desc:  'За цялото семейство',
    href:  '/igri?tip=Family',
    color: 'hover:border-blue-300 hover:bg-blue-50',
  },
  {
    emoji: '👶',
    label: 'Деца',
    desc:  'Подходящи за деца',
    href:  '/igri?vozrast=8',
    color: 'hover:border-yellow-300 hover:bg-yellow-50',
  },
  {
    emoji: '👫',
    label: 'Двама',
    desc:  'За дуели',
    href:  '/igri?igrali=2',
    color: 'hover:border-pink-300 hover:bg-pink-50',
  },
  {
    emoji: '🎉',
    label: 'Парти',
    desc:  'Весело в компания',
    href:  '/igri?tip=Party',
    color: 'hover:border-orange-300 hover:bg-orange-50',
  },
  {
    emoji: '♟️',
    label: 'Стратегия',
    desc:  'За опитни играчи',
    href:  '/igri?tip=Strategy',
    color: 'hover:border-purple-300 hover:bg-purple-50',
  },
]

export default function OccasionSection() {
  return (
    <section className="py-14 bg-gray-50/60">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">🎯 Намери игра според случая</h2>
          <p className="text-sm text-gray-500">Избери ситуацията и ще ти покажем подходящи игри</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {СЛУЧАИ.map((с) => (
            <Link
              key={с.href}
              href={с.href}
              className={`group flex flex-col items-center gap-1.5 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm ${с.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-[120px]`}
            >
              <span className="text-3xl">{с.emoji}</span>
              <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{с.label}</span>
              <span className="text-xs text-gray-400 text-center leading-tight">{с.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
