'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Константи ───────────────────────────────────

const БРОЙ_ИГРАЧИ = [
  { стойност: '1', надпис: '1 играч' },
  { стойност: '2', надпис: '2 играча' },
  { стойност: '3', надпис: '3 играча' },
  { стойност: '4', надпис: '4 играча' },
  { стойност: '5', надпис: '5+ играча' },
]

const ВРЕМЕТРАЕНЕ = [
  { стойност: '30',  надпис: 'До 30 мин' },
  { стойност: '60',  надпис: 'До 1 час' },
  { стойност: '120', надпис: 'До 2 часа' },
  { стойност: '240', надпис: 'Над 4 часа' },
]

const МИНИМАЛНА_ВЪЗРАСТ = [
  { стойност: '8',  надпис: 'До 8 г. (деца)' },
  { стойност: '10', надпис: 'До 10 г.' },
  { стойност: '12', надпис: 'До 12 г.' },
  { стойност: '14', надпис: 'До 14 г.' },
  { стойност: '16', надпис: 'Над 16 г.' },
]

const ТИПОВЕ_ИГРИ = [
  { стойност: 'Strategy',    надпис: 'Стратегически' },
  { стойност: 'Thematic',    надпис: 'Тематични' },
  { стойност: 'Family',      надпис: 'Семейни' },
  { стойност: 'Party',       надпис: 'Парти' },
  { стойност: 'Abstract',    надпис: 'Абстрактни' },
  { стойност: 'Cooperative', надпис: 'Кооперативни' },
  { стойност: 'Children',    надпис: 'Детски' },
  { стойност: 'Wargame',     надпис: 'Военни' },
]

const MAX_WEIGHT = 5

// ── Главен компонент ────────────────────────────

export default function SearchFilters() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drawer, setDrawer] = useState(false)

  // Текущи стойности от URL
  const cPlayers  = searchParams.get('igrali') ?? ''
  const cVreme    = searchParams.get('vreme') ?? ''
  const cVozrast  = searchParams.get('vozrast') ?? ''
  const cTypes    = searchParams.get('tip')?.split(',').filter(Boolean) ?? []
  const cWeightRaw = searchParams.get('slozhnost')
  const cWeight   = cWeightRaw ? parseFloat(cWeightRaw) : MAX_WEIGHT

  // Локална стойност на slider (за плавно показване при влачене)
  const [sliderVal, setSliderVal] = useState(cWeight)
  useEffect(() => { setSliderVal(cWeight) }, [cWeight])

  // Брой активни филтри
  const активниБрой = [
    cPlayers,
    cVreme,
    cVozrast,
    cTypes.length > 0 ? 'types' : '',
    cWeight < MAX_WEIGHT ? 'weight' : '',
  ].filter(Boolean).length

  // ── URL обновяване ────────────────────────────

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString())
    if (!value) next.delete(key); else next.set(key, value)
    next.delete('stranica')
    startTransition(() => {
      router.push(`/igri?${next.toString()}`, { scroll: false })
    })
  }

  function toggleType(тип: string) {
    const current = [...cTypes]
    const idx = current.indexOf(тип)
    if (idx >= 0) current.splice(idx, 1); else current.push(тип)
    setParam('tip', current.length > 0 ? current.join(',') : null)
  }

  function clearAll() {
    const q = searchParams.get('q')
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    startTransition(() => {
      router.push(`/igri?${next.toString()}`, { scroll: false })
    })
  }

  // ── Панел с филтри ────────────────────────────

  const filterPanel = (
    <div className={`space-y-6 ${isPending ? 'opacity-60 pointer-events-none' : ''} transition-opacity`}>

      {/* Брой играчи */}
      <FilterSection
        заглавие="Брой играчи"
        активен={!!cPlayers}
        onИзчисти={() => setParam('igrali', null)}
      >
        {БРОЙ_ИГРАЧИ.map(({ стойност, надпис }) => (
          <RadioOption
            key={стойност}
            name="играчи"
            стойност={стойност}
            надпис={надпис}
            checked={cPlayers === стойност}
            onChange={() => setParam('igrali', cPlayers === стойност ? null : стойност)}
          />
        ))}
      </FilterSection>

      {/* Времетраене */}
      <FilterSection
        заглавие="Времетраене"
        активен={!!cVreme}
        onИзчисти={() => setParam('vreme', null)}
      >
        {ВРЕМЕТРАЕНЕ.map(({ стойност, надпис }) => (
          <RadioOption
            key={стойност}
            name="vreme"
            стойност={стойност}
            надпис={надпис}
            checked={cVreme === стойност}
            onChange={() => setParam('vreme', cVreme === стойност ? null : стойност)}
          />
        ))}
      </FilterSection>

      {/* Минимална възраст */}
      <FilterSection
        заглавие="Подходящо за"
        активен={!!cVozrast}
        onИзчисти={() => setParam('vozrast', null)}
      >
        {МИНИМАЛНА_ВЪЗРАСТ.map(({ стойност, надпис }) => (
          <RadioOption
            key={стойност}
            name="vozrast"
            стойност={стойност}
            надпис={надпис}
            checked={cVozrast === стойност}
            onChange={() => setParam('vozrast', cVozrast === стойност ? null : стойност)}
          />
        ))}
      </FilterSection>

      {/* Тип игра */}
      <FilterSection
        заглавие="Тип игра"
        активен={cTypes.length > 0}
        onИзчисти={() => setParam('tip', null)}
      >
        {ТИПОВЕ_ИГРИ.map(({ стойност, надпис }) => (
          <label key={стойност} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={cTypes.includes(стойност)}
              onChange={() => toggleType(стойност)}
              className="w-4 h-4 accent-brand-600 cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">
              {надпис}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Сложност */}
      <FilterSection
        заглавие={`Сложност: ${sliderVal < MAX_WEIGHT ? `до ${sliderVal.toFixed(1)}` : 'всяка'}`}
        активен={cWeight < MAX_WEIGHT}
        onИзчисти={() => { setSliderVal(MAX_WEIGHT); setParam('slozhnost', null) }}
      >
        <div className="px-1">
          <input
            type="range"
            min={1}
            max={MAX_WEIGHT}
            step={0.5}
            value={sliderVal}
            onChange={(е) => setSliderVal(parseFloat(е.target.value))}
            onPointerUp={(е) => {
              const v = parseFloat((е.target as HTMLInputElement).value)
              setParam('slozhnost', v >= MAX_WEIGHT ? null : v.toString())
            }}
            className="w-full accent-brand-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Лесна</span>
            <span>Средна</span>
            <span>Трудна</span>
          </div>
        </div>
      </FilterSection>

      {/* Изчисти всички */}
      {активниБрой > 0 && (
        <button
          onClick={clearAll}
          className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          Изчисти всички филтри ({активниБрой})
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Мобилен бутон */}
      <div className="md:hidden">
        <button
          onClick={() => setDrawer(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <FilterIcon />
          Филтри
          {активниБрой > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white text-brand-600 text-xs rounded-full font-bold">
              {активниБрой}
            </span>
          )}
        </button>
      </div>

      {/* Десктоп sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Филтри</h2>
          {активниБрой > 0 && (
            <span className="text-xs text-brand-600 font-medium">{активниБрой} активни</span>
          )}
        </div>
        {filterPanel}
      </aside>

      {/* Мобилно drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Филтри">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          {/* Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900">Филтри</h2>
              <button
                onClick={() => setDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Затвори филтрите"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {filterPanel}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setDrawer(false)}
                className="w-full py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
              >
                Виж резултатите
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Помощни компоненти ─────────────────────────

function FilterSection({
  заглавие,
  активен,
  onИзчисти,
  children,
}: {
  заглавие: string
  активен: boolean
  onИзчисти: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{заглавие}</h3>
        {активен && (
          <button
            onClick={onИзчисти}
            className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            Изчисти
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function RadioOption({
  name,
  стойност,
  надпис,
  checked,
  onChange,
}: {
  name: string
  стойност: string
  надпис: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        name={name}
        value={стойност}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-brand-600 cursor-pointer"
      />
      <span className={`text-sm transition-colors ${checked ? 'text-brand-600 font-medium' : 'text-gray-700 group-hover:text-brand-600'}`}>
        {надпис}
      </span>
    </label>
  )
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  )
}
