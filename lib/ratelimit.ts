import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis }                    from '@upstash/redis'

let _redis: Redis | undefined

function getRedis(): Redis {
  return _redis ??= new Redis({
    url:   process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

// Lazy limiter — Redis и Ratelimit се инициализират само при първа заявка, не при билд
function lazyLimiter(prefix: string, window: Duration, max: number) {
  let rl: Ratelimit | undefined
  return {
    limit: (identifier: string) => {
      rl ??= new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(max, window), prefix, analytics: false })
      return rl.limit(identifier)
    },
  }
}

export const contactLimiter    = lazyLimiter('rl:contact',    '10 m', 3)
export const newsletterLimiter = lazyLimiter('rl:newsletter', '1 h',  3)
export const playsLimiter      = lazyLimiter('rl:plays',      '1 m',  30)
export const loginLimiter      = lazyLimiter('rl:login',      '15 m', 10)
export const reviewsLimiter    = lazyLimiter('rl:reviews',    '1 h',  10)
export const threadsLimiter    = lazyLimiter('rl:threads',    '1 h',  5)
export const repliesLimiter    = lazyLimiter('rl:replies',    '1 h',  20)
