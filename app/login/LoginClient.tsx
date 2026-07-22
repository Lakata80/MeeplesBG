'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  влизане,
  регистрация,
  влизанеСGoogle,
} from '@/app/actions/auth'

const NEXTAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: 'Имейлът вече е регистриран с друг метод за вход.',
  OAuthSignin:           'Грешка при OAuth вход. Опитайте отново.',
  OAuthCallback:         'Грешка при OAuth callback. Опитайте отново.',
  CredentialsSignin:     'Невалиден имейл или парола.',
  SessionRequired:       'Трябва да влезете, за да продължите.',
  Default:               'Грешка при вход. Опитайте отново.',
}

function валиденИмейл(стойност: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(стойност)
}

type Таб = 'вход' | 'регистрация'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  )
}

function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  className,
}: {
  id: string
  name: string
  autoComplete: string
  placeholder: string
  className: string
}) {
  const [показва, setПоказва] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={показва ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        className={className + ' pr-10'}
      />
      <button
        type="button"
        onClick={() => setПоказва((п) => !п)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={показва ? 'Скрий паролата' : 'Покажи паролата'}
      >
        <EyeIcon open={показва} />
      </button>
    </div>
  )
}

export default function LoginClient() {
  const searchParams   = useSearchParams()
  const callbackUrl    = searchParams.get('callbackUrl') ?? '/'
  const errorKey       = searchParams.get('error') ?? ''
  const urlError       = NEXTAUTH_ERRORS[errorKey] ?? (errorKey ? NEXTAUTH_ERRORS.Default : null)
  const registered     = searchParams.get('registered') === '1'

  const defaultTab: Таб = searchParams.get('tab') === 'регистрация' ? 'регистрация' : 'вход'
  const [активенТаб, setАктивенТаб] = useState<Таб>(defaultTab)

  const [имейлГрешкаВход, setИмейлГрешкаВход] = useState<string | null>(null)
  const [имейлГрешкаРег,  setИмейлГрешкаРег]  = useState<string | null>(null)

  const влизанеAction     = влизане.bind(null, callbackUrl)
  const регистрацияAction = регистрация.bind(null, callbackUrl)

  const [входСтатус, входAction, входPending] = useActionState(влизанеAction, undefined)
  const [регСтатус,  регAction,  регPending]  = useActionState(регистрацияAction, undefined)

  function проверкаИмейл(стойност: string, таб: 'вход' | 'регистрация') {
    if (!стойност) return
    const грешка = валиденИмейл(стойност) ? null : 'Въведете валиден имейл адрес.'
    if (таб === 'вход') setИмейлГрешкаВход(грешка)
    else setИмейлГрешкаРег(грешка)
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white'

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Лого */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-brand-600 hover:text-brand-700 transition-colors">
            🎲 MeeplesBG
          </Link>
          <p className="text-sm text-gray-500 mt-1">Вашата общност за настолни игри</p>
        </div>

        {/* Карта */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(['вход', 'регистрация'] as const).map((таб) => (
              <button
                key={таб}
                type="button"
                onClick={() => setАктивенТаб(таб)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  активенТаб === таб
                    ? 'text-brand-700 border-b-2 border-brand-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                }`}
              >
                {таб === 'вход' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Успешна регистрация — auto-login не сработи */}
            {registered && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Акаунтът е създаден успешно! Влез с имейл и паролата си.
              </div>
            )}

            {/* URL грешка от NextAuth */}
            {urlError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {urlError}
              </div>
            )}

            {/* Социален вход */}
            <div className="space-y-2.5 mb-5">
              <form action={() => влизанеСGoogle(callbackUrl)}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border)] bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                >
                  <GoogleIcon />
                  Продължи с Google
                </button>
              </form>
            </div>

            {/* Разделител */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">или с имейл</span>
              </div>
            </div>

            {/* ── ФОРМА ВХОД ─────────────────────── */}
            {активенТаб === 'вход' && (
              <form action={входAction} className="space-y-4">
                {входСтатус?.съобщение && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {входСтатус.съобщение}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Имейл
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    onBlur={(e) => проверкаИмейл(e.target.value, 'вход')}
                    onChange={() => имейлГрешкаВход && setИмейлГрешкаВход(null)}
                    className={inputClass}
                  />
                  {(имейлГрешкаВход ?? входСтатус?.грешки?.email?.[0]) && (
                    <p className="mt-1 text-xs text-red-600">
                      {имейлГрешкаВход ?? входСтатус!.грешки!.email![0]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="login-парола" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Парола
                  </label>
                  <PasswordInput
                    id="login-парола"
                    name="парола"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  {входСтатус?.грешки?.парола && (
                    <p className="mt-1 text-xs text-red-600">{входСтатус.грешки.парола[0]}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={входPending}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {входPending ? 'Влизане…' : 'Влез'}
                </button>
              </form>
            )}

            {/* ── ФОРМА РЕГИСТРАЦИЯ ───────────────── */}
            {активенТаб === 'регистрация' && (
              <form action={регAction} className="space-y-4">
                {регСтатус?.съобщение && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {регСтатус.съобщение}
                  </div>
                )}

                <div>
                  <label htmlFor="reg-ime" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Вашето име
                  </label>
                  <input
                    id="reg-ime"
                    name="ime"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Иван Иванов"
                    className={inputClass}
                  />
                  {регСтатус?.грешки?.ime && (
                    <p className="mt-1 text-xs text-red-600">{регСтатус.грешки.ime[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Имейл
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    onBlur={(e) => проверкаИмейл(e.target.value, 'регистрация')}
                    onChange={() => имейлГрешкаРег && setИмейлГрешкаРег(null)}
                    className={inputClass}
                  />
                  {(имейлГрешкаРег ?? регСтатус?.грешки?.email?.[0]) && (
                    <p className="mt-1 text-xs text-red-600">
                      {имейлГрешкаРег ?? регСтатус!.грешки!.email![0]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-парола" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Парола
                  </label>
                  <PasswordInput
                    id="reg-парола"
                    name="парола"
                    autoComplete="new-password"
                    placeholder="Минимум 8 символа"
                    className={inputClass}
                  />
                  {регСтатус?.грешки?.парола && (
                    <p className="mt-1 text-xs text-red-600">{регСтатус.грешки.парола[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-потвърди" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Потвърди паролата
                  </label>
                  <PasswordInput
                    id="reg-потвърди"
                    name="потвърдиПарола"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  {регСтатус?.грешки?.потвърдиПарола && (
                    <p className="mt-1 text-xs text-red-600">{регСтатус.грешки.потвърдиПарола[0]}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={регPending}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {регPending ? 'Регистрация…' : 'Създай акаунт'}
                </button>

                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Като се регистрираш, приемаш нашите{' '}
                  <Link href="/pravila" className="underline hover:text-brand-600">Правила</Link>
                  {' '}и{' '}
                  <Link href="/gdpr" className="underline hover:text-brand-600">Политика за поверителност</Link>.
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            ← Обратно към началото
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
