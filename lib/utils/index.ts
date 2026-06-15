/**
 * Помощни функции за MeeplesBG
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Комбинира CSS класове с Tailwind поддръжка
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматира минути в четим формат (напр. "1ч 30м")
 */
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}м`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
}

/**
 * Генерира slug от текст
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яА-Я]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Форматира рейтинг за показване
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/**
 * Връща текст за брой играчи
 */
export function formatPlayers(min?: number, max?: number): string {
  if (!min && !max) return 'Неизвестно'
  if (min === max) return `${min} играча`
  if (!max) return `${min}+ играча`
  if (!min) return `до ${max} играча`
  return `${min}-${max} играча`
}
