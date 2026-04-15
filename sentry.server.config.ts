import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  sendDefaultPii: false,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,

  includeLocalVariables: true,
  enableLogs: true,

  enabled: process.env.NODE_ENV === "production",

  beforeSend(event) {
    if (event.message) {
      event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
      event.message = event.message.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        "[PHONE]"
      );
    }

    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      const piiFields = [
        "email",
        "phone",
        "tenant_email",
        "tenant_phone",
        "landlord_email",
        "landlord_phone",
      ];
      piiFields.forEach((field) => {
        if (data[field]) {
          data[field] = "[REDACTED]";
        }
      });
    }

    return event;
  },

  ignoreErrors: ["ECONNREFUSED", "ETIMEDOUT"],
});
