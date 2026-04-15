import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.2,

  // Session Replay sampling
  replaysOnErrorSampleRate: 1.0, // Capture all sessions with errors
  replaysSessionSampleRate: 0.1, // Capture 10% of regular sessions

  // You can also enable this to capture console logs
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Mask PII
      blockAllMedia: true,
    }),
  ],

  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",

  // PII filtering
  beforeSend(event, hint) {
    // Remove PII from error messages and breadcrumbs
    if (event.message) {
      // Redact email addresses
      event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
      // Redact phone numbers
      event.message = event.message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    }

    return event;
  },

  // Filter out known errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Random network errors
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});
