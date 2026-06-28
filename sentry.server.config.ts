// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a145c78d04483231855a1ea71175cc89@o4511644168093696.ingest.de.sentry.io/4511644178120784",
  tracesSampleRate: 1,
  enableLogs: true,
});
