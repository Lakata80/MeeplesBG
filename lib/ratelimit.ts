import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const contactLimiter = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(3, '10 m'),
  prefix:    'rl:contact',
  analytics: false,
})

export const newsletterLimiter = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(3, '1 h'),
  prefix:    'rl:newsletter',
  analytics: false,
})

export const playsLimiter = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(30, '1 m'),
  prefix:    'rl:plays',
  analytics: false,
})
