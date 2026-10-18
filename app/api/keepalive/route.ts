import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  let redisOk = false
  try {
    await redis.ping()
    redisOk = true
  } catch {
    // Redis недостъпен — логваме, но не срещаме cron-а
    console.warn('keepalive: Redis ping failed')
  }

  return Response.json({ ok: true, redis: redisOk })
}
