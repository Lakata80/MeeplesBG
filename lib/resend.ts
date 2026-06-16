import { Resend } from 'resend'

// Единствен Resend клиент за целия проект.
// RESEND_API_KEY трябва да е зададен в .env.local за реални изпращания.
export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_build')

export const ИЗПРАЩАЧ = process.env.RESEND_FROM ?? 'MeeplesBG <newsletter@meeplebg.com>'
export const САЙТ_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplebg.com'
