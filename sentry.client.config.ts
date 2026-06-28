import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://a145c78d04483231855a1ea71175cc89@o4511644168093696.ingest.de.sentry.io/4511644178120784',
  tracesSampleRate: 1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
})
