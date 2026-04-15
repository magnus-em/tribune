"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              We&apos;ve been notified and are looking into it. Please try refreshing the page.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
