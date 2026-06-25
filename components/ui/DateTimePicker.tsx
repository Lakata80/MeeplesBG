'use client'

import { useState, useId } from 'react'

interface Props {
  name: string
  defaultValue?: string
  requireFuture?: boolean  // default true
}

const clsBase = 'px-2 py-2 border-2 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors'
const clsOk   = 'border-gray-300'
const clsErr  = 'border-red-400 bg-red-50'

// ── Валидация ─────────────────────────────────────────────────

function validate(d: string, m: string, y: string, h: string, min: string, requireFuture: boolean): string | null {
  const anyFilled = d || m || y || h || min
  if (!anyFilled) return null

  const di = parseInt(d),  mi = parseInt(m),  yi = parseInt(y)
  const hi = parseInt(h || '0'), mini = parseInt(min || '0')

  if (!d || isNaN(di) || di < 1 || di > 31)
    return 'Денят трябва да е между 1 и 31.'
  if (!m || isNaN(mi) || mi < 1 || mi > 12)
    return 'Месецът трябва да е между 1 и 12.'
  if (!y || y.length < 4 || isNaN(yi))
    return 'Въведи валидна година (4 цифри).'

  const thisYear = new Date().getFullYear()
  if (yi < thisYear || yi > thisYear + 10)
    return `Годината трябва да е между ${thisYear} и ${thisYear + 10}.`

  if (isNaN(hi) || hi < 0 || hi > 23)
    return 'Часът трябва да е между 0 и 23.'
  if (isNaN(mini) || mini < 0 || mini > 59)
    return 'Минутите трябва да са между 0 и 59.'

  // Проверка дали датата съществува (напр. 30 февруари)
  const date = new Date(yi, mi - 1, di, hi, mini)
  if (date.getMonth() !== mi - 1 || date.getDate() !== di)
    return `${di}.${m}.${yi} не е валидна дата.`

  if (requireFuture && date <= new Date())
    return 'Датата трябва да е в бъдещето.'

  return null
}

function buildISO(d: string, m: string, y: string, h: string, min: string): string {
  if (!d || !m || !y || y.length < 4) return ''
  const di = parseInt(d), mi = parseInt(m), yi = parseInt(y)
  const hi = parseInt(h || '0'), mini = parseInt(min || '0')
  if (isNaN(di) || isNaN(mi) || isNaN(yi)) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${yi}-${pad(mi)}-${pad(di)}T${pad(hi)}:${pad(mini)}`
}

// ── Компонент ─────────────────────────────────────────────────

export default function DateTimePicker({ name, defaultValue, requireFuture = true }: Props) {
  const id   = useId()
  const init = defaultValue ? new Date(defaultValue) : null

  const [day,    setDay]    = useState(init ? String(init.getDate()).padStart(2, '0')        : '')
  const [month,  setMonth]  = useState(init ? String(init.getMonth() + 1).padStart(2, '0')  : '')
  const [year,   setYear]   = useState(init ? String(init.getFullYear())                     : '')
  const [hour,   setHour]   = useState(init ? String(init.getHours()).padStart(2, '0')       : '')
  const [minute, setMinute] = useState(init ? String(init.getMinutes()).padStart(2, '0')     : '')
  const [error,  setError]  = useState<string | null>(null)

  function runValidation(d: string, m: string, y: string, h: string, min: string) {
    setError(validate(d, m, y, h, min, requireFuture))
  }

  function handleBlurDay(v: string) {
    const padded = v ? v.padStart(2, '0') : ''
    setDay(padded)
    runValidation(padded, month, year, hour, minute)
  }
  function handleBlurMonth(v: string) {
    const padded = v ? v.padStart(2, '0') : ''
    setMonth(padded)
    runValidation(day, padded, year, hour, minute)
  }
  function handleBlurYear(v: string) {
    runValidation(day, month, v, hour, minute)
  }
  function handleBlurHour(v: string) {
    const padded = v ? v.padStart(2, '0') : ''
    setHour(padded)
    runValidation(day, month, year, padded, minute)
  }
  function handleBlurMinute(v: string) {
    const padded = v ? v.padStart(2, '0') : ''
    setMinute(padded)
    runValidation(day, month, year, hour, padded)
  }

  const isoValue = error ? '' : buildISO(day, month, year, hour, minute)
  const hasError = !!error

  return (
    <div aria-label="Дата и час">
      <input type="hidden" name={name} value={isoValue} />

      <div className="flex items-center gap-1 flex-wrap">
        {/* Дата */}
        <div className="flex items-center gap-1">
          <input
            id={`${id}-day`}
            type="text"
            inputMode="numeric"
            value={day}
            onChange={e => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={e => handleBlurDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="ДД"
            maxLength={2}
            className={`${clsBase} ${hasError ? clsErr : clsOk} w-12`}
            aria-label="Ден"
          />
          <span className="text-gray-400 font-medium">.</span>
          <input
            id={`${id}-month`}
            type="text"
            inputMode="numeric"
            value={month}
            onChange={e => setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={e => handleBlurMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="ММ"
            maxLength={2}
            className={`${clsBase} ${hasError ? clsErr : clsOk} w-12`}
            aria-label="Месец"
          />
          <span className="text-gray-400 font-medium">.</span>
          <input
            id={`${id}-year`}
            type="text"
            inputMode="numeric"
            value={year}
            onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={e => handleBlurYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="ГГГГ"
            maxLength={4}
            className={`${clsBase} ${hasError ? clsErr : clsOk} w-16`}
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
            onChange={e => setHour(e.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={e => handleBlurHour(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="ЧЧ"
            maxLength={2}
            className={`${clsBase} ${hasError ? clsErr : clsOk} w-12`}
            aria-label="Час"
          />
          <span className="text-gray-400 font-bold">:</span>
          <input
            id={`${id}-minute`}
            type="text"
            inputMode="numeric"
            value={minute}
            onChange={e => setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={e => handleBlurMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="ММ"
            maxLength={2}
            className={`${clsBase} ${hasError ? clsErr : clsOk} w-12`}
            aria-label="Минута"
          />
        </div>
      </div>

      {/* Съобщение за грешка */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
