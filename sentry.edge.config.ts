import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f27bdc279e69de3585db33338468dc4c@o4511226089701376.ingest.us.sentry.io/4511226092453888",

  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  enableLogs: true,
});
