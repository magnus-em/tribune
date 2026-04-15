import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production
  tracesSampleRate: 1.0,

  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",

  // PII filtering
  beforeSend(event, hint) {
    // Remove PII from error messages
    if (event.message) {
      event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
      event.message = event.message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    }

    // Remove PII from request data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      const piiFields = ['email', 'phone', 'tenant_email', 'tenant_phone', 'landlord_email', 'landlord_phone'];
      piiFields.forEach(field => {
        if (data[field]) {
          data[field] = '[REDACTED]';
        }
      });
    }

    return event;
  },

  // Filter out known errors
  ignoreErrors: [
    "ECONNREFUSED",
    "ETIMEDOUT",
  ],
});
