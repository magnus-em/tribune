"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
      !process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      // PII scrubbing — never send names, emails, phones, addresses, or amounts
      sanitize_properties: (properties) => {
        const piiPatterns: [RegExp, string][] = [
          [/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]"],
          [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]"],
        ];
        const scrubbed: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(properties)) {
          if (typeof value === "string") {
            let cleaned = value;
            for (const [pattern, replacement] of piiPatterns) {
              cleaned = cleaned.replace(pattern, replacement);
            }
            scrubbed[key] = cleaned;
          } else {
            scrubbed[key] = value;
          }
        }
        return scrubbed;
      },
      // Don't record in development
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.opt_out_capturing();
        }
      },
    });
  }, []);

  if (
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  ) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Tracked events — use these instead of raw posthog.capture
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string) {
  if (typeof window === "undefined") return;
  posthog.identify(userId);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
