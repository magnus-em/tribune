import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f27bdc279e69de3585db33338468dc4c@o4511226089701376.ingest.us.sentry.io/4511226092453888",

  // PII protection — no names, emails, phones, addresses in error reports
  sendDefaultPii: false,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  enableLogs: true,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Scrub PII from error messages
  beforeSend(event) {
    if (event.message) {
      event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
      event.message = event.message.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        "[PHONE]"
      );
    }
    return event;
  },

  ignoreErrors: [
    "top.GLOBALS",
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
