import type { NextRequest } from 'next/server'
import { prisma }          from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/newsletter/unsubscribe?token=...
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new Response(страница('Невалидна заявка', 'Липсва токен за отписване.', false), {
      status:  400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const абонат = await prisma.newsletterSubscriber.findUnique({
    where:  { unsubscribeToken: token },
    select: { id: true, isActive: true },
  })

  if (!абонат) {
    return new Response(страница('Невалидна заявка', 'Токенът за отписване не съществува.', false), {
      status:  404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!абонат.isActive) {
    return new Response(страница('Вече отписан', 'Вече си отписан от нашия бюлетин.', true), {
      status:  200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  await prisma.newsletterSubscriber.update({
    where: { id: абонат.id },
    data:  { isActive: false },
  })

  return new Response(страница('Успешно отписване', 'Успешно се отписа от бюлетина.', true), {
    status:  200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function страница(заглавие: string, съобщение: string, успех: boolean): string {
  const цвят = успех ? '#16a34a' : '#dc2626'
  const икона = успех ? '✓' : '✗'
  return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${заглавие} — MeeplesBG</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f4f4f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
      max-width: 480px;
      padding: 48px 40px;
      text-align: center;
      width: 100%;
    }
    .icon {
      background: ${цвят}20;
      border-radius: 50%;
      color: ${цвят};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      height: 72px;
      margin-bottom: 24px;
      width: 72px;
    }
    h1 { color: #111827; font-size: 22px; margin-bottom: 12px; }
    p  { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
    a  {
      background: #2563eb;
      border-radius: 8px;
      color: #fff;
      display: inline-block;
      font-size: 15px;
      font-weight: 600;
      padding: 12px 28px;
      text-decoration: none;
    }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${икона}</div>
    <h1>${заглавие}</h1>
    <p>${съобщение}</p>
    <a href="/">Към началната страница</a>
  </div>
</body>
</html>`
}
