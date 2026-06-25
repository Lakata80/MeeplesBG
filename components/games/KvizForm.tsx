'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Константи ────────────────────────────────────────────────

const ИГРАЧИ = [
  { стойност: '1', надпис: '1 играч' },
  { стойност: '2', надпис: '2 играча' },
  { стойност: '3', надпис: '3 играча' },
  { стойност: '4', надпис: '4 играча' },
  { стойност: '5', надпис: '5+ играча' },
]

const ВРЕМЕТРАЕНЕ = [
  { стойност: '30',   надпис: 'До 30 мин' },
  { стойност: '60',   надпис: 'До 1 час' },
  { стойност: '90',   надпис: 'До 90 мин' },
  { стойност: '120',  надпис: 'До 2 часа' },
  { стойност: 'long', надпис: 'Над 3 часа' },
]

const СЛОЖНОСТ = [
  { стойност: 'easy',   надпис: '😊 Лесна',  desc: 'Подходяща за всеки' },
  { стойност: 'medium', надпис: '🧩 Средна', desc: 'Малко правила и стратегия' },
  { стойност: 'hard',   надпис: '🧠 Сложна', desc: 'За опитни играчи' },
]

const ТИПОВЕ = [
  { стойност: 'Cooperative', надпис: '🤝 Кооперативна' },
  { стойност: 'Strategy',    надпис: '♟️ Стратегическа' },
  { стойност: 'Wargame',     надпис: '⚔️ Военна' },
  { стойност: 'Party',       надпис: '🎉 Парти' },
  { стойност: 'Family',      надпис: '👨‍👩‍👧 Семейна' },
  { стойност: 'Thematic',    надпис: '🎭 Тематична' },
]

const ВЪЗРАСТ = [
  { стойност: '8',  надпис: 'До 8 г. (деца)' },
  { стойност: '10', надпис: 'До 10 г.' },
  { стойност: '12', надпис: 'До 12 г.' },
  { стойност: '14', надпис: 'До 14 г.' },
  { стойност: '16', надпис: 'Над 16 г.' },
]

// ── Типове ───────────────────────────────────────────────────

export interface KvizDefaults {
  players?:    string
  time?:       string
  complexity?: string
  types?:      string[]
  age?:        string
}

// ── Компонент ────────────────────────────────────────────────

export default function KvizForm({ defaults = {} }: { defaults?: KvizDefaults }) {
  const router = useRouter()

  const [players,    setPlayers]    = useState(defaults.players    ?? '')
  const [time,       setTime]       = useState(defaults.time       ?? '')
  const [complexity, setComplexity] = useState(defaults.complexity ?? '')
  const [types,      setTypes]      = useState<string[]>(defaults.types ?? [])
  const [age,        setAge]        = useState(defaults.age        ?? '')

  function toggleType(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function handleSubmit() {
    const p = new URLSearchParams()
    if (players)          p.set('players',    players)
    if (time)             p.set('time',       time)
    if (complexity)       p.set('complexity', complexity)
    if (types.length > 0) p.set('types',      types.join(','))
    if (age)              p.set('age',        age)
    router.push(`/igri/kviz?${p.toString()}`)
  }

  function handleClear() {
    setPlayers(''); setTime(''); setComplexity(''); setTypes([]); setAge('')
    router.push('/igri/kviz')
  }

  const hasAny = !!(players || time || complexity || types.length || age)

  return (
    <div className="space-y-7">

      {/* Брой играчи */}
      <QuestionSection number={1} label="Колко играчи сте?">
        <PillRow
          options={ИГРАЧИ}
          selected={players}
          onSelect={(v) => setPlayers(v === players ? '' : v)}
        />
      </QuestionSection>

      {/* Времетраене */}
      <QuestionSection number={2} label="Колко време имате?">
        <PillRow
          options={ВРЕМЕТРАЕНЕ}
          selected={time}
          onSelect={(v) => setTime(v === time ? '' : v)}
        />
      </QuestionSection>

      {/* Сложност */}
      <QuestionSection number={3} label="Каква сложност търсите?">
        <div className="flex flex-wrap gap-3">
          {СЛОЖНОСТ.map(({ стойност, надпис, desc }) => {
            const active = complexity === стойност
            return (
              <button
                key={стойност}
                type="button"
                onClick={() => setComplexity(active ? '' : стойност)}
                className={`px-5 py-3 rounded-xl text-sm border-2 transition-all text-left min-w-[130px] ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <div className="font-semibold">{надпис}</div>
                <div className="text-xs opacity-60 mt-0.5">{desc}</div>
              </button>
            )
          })}
        </div>
      </QuestionSection>

      {/* Тип игра */}
      <QuestionSection number={4} label="Тип игра?" hint="може повече от едно">
        <div className="flex flex-wrap gap-2">
          {ТИПОВЕ.map(({ стойност, надпис }) => {
            const active = types.includes(стойност)
            return (
              <button
                key={стойност}
                type="button"
                onClick={() => toggleType(стойност)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {надпис}
              </button>
            )
          })}
        </div>
      </QuestionSection>

      {/* За кого */}
      <QuestionSection number={5} label="За кого е?">
        <PillRow
          options={ВЪЗРАСТ}
          selected={age}
          onSelect={(v) => setAge(v === age ? '' : v)}
        />
      </QuestionSection>

      {/* Действия */}
      <div className="flex gap-3 pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-sm"
        >
          🎲 Намери игри
        </button>
        {hasAny && (
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Изчисти
          </button>
        )}
      </div>
    </div>
  )
}

// ── Помощни компоненти ────────────────────────────────────────

function QuestionSection({
  number,
  label,
  hint,
  children,
}: {
  number: number
  label:  string
  hint?:  string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        {hint && <span className="text-xs text-gray-400">({hint})</span>}
      </div>
      {children}
    </div>
  )
}

function PillRow({
  options,
  selected,
  onSelect,
}: {
  options:  { стойност: string; надпис: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ стойност, надпис }) => {
        const active = selected === стойност
        return (
          <button
            key={стойност}
            type="button"
            onClick={() => onSelect(стойност)}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
              active
                ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {надпис}
          </button>
        )
      })}
    </div>
  )
}
