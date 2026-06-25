import Link from 'next/link'
import { EVENT_TYPES, type EventTypeName } from '@/lib/obshtnost'

export interface CalendarEvent {
  id:           string
  slug:         string
  title:        string
  eventDate:    Date | null
  eventEndDate: Date | null
  eventType:    string | null
  eventCity:    string | null
  eventClub:    string | null
  _count:       { replies: number }
}

interface Props {
  upcoming: CalendarEvent[]
  past:     CalendarEvent[]
}

// ── Date helpers ──────────────────────────────────────────────

const SHORT_MONTH   = new Intl.DateTimeFormat('bg-BG', { month: 'short' })
const SHORT_WEEKDAY = new Intl.DateTimeFormat('bg-BG', { weekday: 'short' })
const TIME_FMT      = new Intl.DateTimeFormat('bg-BG', { hour: '2-digit', minute: '2-digit' })
const END_DAY_FMT   = new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long' })

function monthKey(d: Date)   { return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}` }
function monthLabel(d: Date) {
  const s = new Intl.DateTimeFormat('bg-BG', { month: 'long', year: 'numeric' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function isToday(d: Date, now: Date) {
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}
function isTomorrow(d: Date, now: Date) {
  const tom = new Date(now); tom.setDate(tom.getDate() + 1)
  return d.getFullYear() === tom.getFullYear() && d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate()
}

function groupByMonth(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    if (!e.eventDate) continue
    const k = monthKey(e.eventDate)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(e)
  }
  return [...map.entries()]
}

// ── Components ────────────────────────────────────────────────

function MonthDivider({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap ${muted ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function EventCard({ event, isPast, now }: { event: CalendarEvent; isPast: boolean; now: Date }) {
  const start      = event.eventDate
  const end        = event.eventEndDate
  const typeConfig = event.eventType ? (EVENT_TYPES[event.eventType as EventTypeName] ?? null) : null

  const today    = start ? isToday(start, now) : false
  const tomorrow = start ? isTomorrow(start, now) : false

  const isMultiDay = !!(end && start && (
    end.getDate() !== start.getDate() ||
    end.getMonth() !== start.getMonth() ||
    end.getFullYear() !== start.getFullYear()
  ))

  return (
    <Link
      href={`/obshtnost/sreshti/${event.slug}`}
      className={`group flex gap-4 bg-white border rounded-2xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-all ${
        isPast
          ? 'border-gray-100 opacity-60'
          : today
          ? 'border-brand-400 shadow-sm ring-1 ring-brand-100'
          : 'border-gray-200'
      }`}
    >
      {/* Date block */}
      {start ? (
        <div className={`shrink-0 w-14 rounded-xl py-2.5 text-center flex flex-col items-center justify-center gap-0.5 ${
          isPast ? 'bg-gray-100' : today ? 'bg-brand-50' : 'bg-orange-50'
        }`}>
          {isMultiDay ? (
            <>
              <div className={`text-base font-bold leading-tight ${isPast ? 'text-gray-400' : today ? 'text-brand-600' : 'text-orange-600'}`}>
                {start.getDate()}–{end!.getDate()}
              </div>
              <div className={`text-xs font-medium ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                {SHORT_MONTH.format(start)}
              </div>
            </>
          ) : (
            <>
              <div className={`text-2xl font-bold leading-none ${isPast ? 'text-gray-400' : today ? 'text-brand-600' : 'text-orange-600'}`}>
                {start.getDate()}
              </div>
              <div className={`text-xs font-medium ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                {SHORT_MONTH.format(start)}
              </div>
              <div className="text-xs text-gray-400">
                {SHORT_WEEKDAY.format(start)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="shrink-0 w-14 rounded-xl py-2.5 bg-gray-50 flex items-center justify-center text-gray-300 text-xl">
          📅
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {typeConfig && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
              {typeConfig.icon} {typeConfig.label}
            </span>
          )}
          {today && !isPast && (
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Днес!</span>
          )}
          {tomorrow && !isPast && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Утре</span>
          )}
          {isPast && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Приключило</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          {start && (
            <span>
              🕐 {TIME_FMT.format(start)}
              {end && !isMultiDay && ` – ${TIME_FMT.format(end)}`}
              {end && isMultiDay && ` – ${END_DAY_FMT.format(end)}`}
            </span>
          )}
          {event.eventCity && <span>📍 {event.eventCity}</span>}
          {event.eventClub && <span>🏛️ {event.eventClub}</span>}
        </div>
      </div>

      {/* Reply count */}
      <div className="shrink-0 text-xs text-gray-400 self-center whitespace-nowrap">
        {event._count.replies} отг. →
      </div>
    </Link>
  )
}

// ── Main export ───────────────────────────────────────────────

export default function EventTimeline({ upcoming, past }: Props) {
  const now = new Date()

  const withDate    = upcoming.filter(e => e.eventDate !== null)
  const noDate      = upcoming.filter(e => e.eventDate === null)
  const upGroups    = groupByMonth(withDate)
  const pastGroups  = groupByMonth(past)

  const isEmpty = upcoming.length === 0 && past.length === 0

  if (isEmpty) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-gray-600 font-medium mb-1">Няма предстоящи събития</p>
        <p className="text-sm">Бъди първи — публикувай ново събитие!</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Upcoming — grouped by month */}
      {upGroups.length === 0 && noDate.length === 0 && (
        <p className="text-gray-400 text-sm py-4 text-center">Няма предстоящи събития.</p>
      )}

      {upGroups.map(([key, events]) => (
        <section key={key}>
          <MonthDivider label={monthLabel(events[0].eventDate!)} />
          <div className="space-y-3 mt-5">
            {events.map(e => <EventCard key={e.id} event={e} isPast={false} now={now} />)}
          </div>
        </section>
      ))}

      {/* Events without a date */}
      {noDate.length > 0 && (
        <section>
          <MonthDivider label="Без определена дата" />
          <div className="space-y-3 mt-5">
            {noDate.map(e => <EventCard key={e.id} event={e} isPast={false} now={now} />)}
          </div>
        </section>
      )}

      {/* Past events — collapsible */}
      {past.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none list-none py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 transition-transform group-open:rotate-90 inline-block">
              ▶
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Минали събития ({past.length})
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </summary>

          <div className="mt-6 space-y-10">
            {pastGroups.map(([key, events]) => (
              <section key={key}>
                <MonthDivider label={monthLabel(events[0].eventDate!)} muted />
                <div className="space-y-3 mt-5">
                  {events.map(e => <EventCard key={e.id} event={e} isPast={true} now={now} />)}
                </div>
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
