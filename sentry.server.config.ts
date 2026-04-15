import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f27bdc279e69de3585db33338468dc4c@o4511226089701376.ingest.us.sentry.io/4511226092453888",

  sendDefaultPii: false,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,

  includeLocalVariables: true,
  enableLogs: true,

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
        "email", "phone", "tenant_email", "tenant_phone",
        "landlord_email", "landlord_phone",
      ];
      piiFields.forEach((field) => {
        if (data[field]) data[field] = "[REDACTED]";
      });
    }

    return event;
  },

  ignoreErrors: ["ECONNREFUSED", "ETIMEDOUT"],
});
