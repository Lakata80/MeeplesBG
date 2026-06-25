'use client'

import { useState, useId } from 'react'

interface Props {
  name: string
  defaultValue?: string
}

const cls = 'px-2 py-2 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500'

export default function DateTimePicker({ name, defaultValue }: Props) {
  const id = useId()

  const init = defaultValue ? new Date(defaultValue) : null
  const [day,    setDay]    = useState(init ? String(init.getDate()).padStart(2, '0')    : '')
  const [month,  setMonth]  = useState(init ? String(init.getMonth() + 1).padStart(2, '0') : '')
  const [year,   setYear]   = useState(init ? String(init.getFullYear()) : '')
  const [hour,   setHour]   = useState(init ? String(init.getHours()).padStart(2, '0')   : '')
  const [minute, setMinute] = useState(init ? String(init.getMinutes()).padStart(2, '0') : '')

  // Build ISO value for hidden input; empty string if any required field is missing
  function buildISO() {
    if (!day || !month || !year || year.length < 4) return ''
    const d = parseInt(day),   m = parseInt(month),  y = parseInt(year)
    const h = parseInt(hour || '0'), min = parseInt(minute || '0')
    if (isNaN(d) || isNaN(m) || isNaN(y)) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`
  }

  function onDay(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 2)
    setDay(n)
  }
  function onMonth(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 2)
    setMonth(n)
  }
  function onYear(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 4)
    setYear(n)
  }
  function onHour(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 2)
    setHour(n)
  }
  function onMinute(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 2)
    setMinute(n)
  }

  const isoValue = buildISO()

  return (
    <div className="flex items-center gap-1 flex-wrap" aria-label="Дата и час">
      <input type="hidden" name={name} value={isoValue} />

      {/* Дата */}
      <div className="flex items-center gap-1">
        <input
          id={`${id}-day`}
          type="text"
          inputMode="numeric"
          value={day}
          onChange={e => onDay(e.target.value)}
          onBlur={e => setDay(e.target.value.padStart(2, '0').slice(-2))}
          placeholder="ДД"
          maxLength={2}
          className={`${cls} w-12`}
          aria-label="Ден"
        />
        <span className="text-gray-400 font-medium">.</span>
        <input
          id={`${id}-month`}
          type="text"
          inputMode="numeric"
          value={month}
          onChange={e => onMonth(e.target.value)}
          onBlur={e => setMonth(e.target.value.padStart(2, '0').slice(-2))}
          placeholder="ММ"
          maxLength={2}
          className={`${cls} w-12`}
          aria-label="Месец"
        />
        <span className="text-gray-400 font-medium">.</span>
        <input
          id={`${id}-year`}
          type="text"
          inputMode="numeric"
          value={year}
          onChange={e => onYear(e.target.value)}
          placeholder="ГГГГ"
          maxLength={4}
          className={`${cls} w-16`}
          aria-label="Година"
        />
      </div>

      {/* Час */}
      <div className="flex items-center gap-1 ml-2">
        <input
          id={`${id}-hour`}
          type="text"
          inputMode="numeric"
          value={hour}
          onChange={e => onHour(e.target.value)}
          onBlur={e => setHour(e.target.value.padStart(2, '0').slice(-2))}
          placeholder="ЧЧ"
          maxLength={2}
          className={`${cls} w-12`}
          aria-label="Час"
        />
        <span className="text-gray-400 font-bold">:</span>
        <input
          id={`${id}-minute`}
          type="text"
          inputMode="numeric"
          value={minute}
          onChange={e => onMinute(e.target.value)}
          onBlur={e => setMinute(e.target.value.padStart(2, '0').slice(-2))}
          placeholder="ММ"
          maxLength={2}
          className={`${cls} w-12`}
          aria-label="Минута"
        />
      </div>
    </div>
  )
}
