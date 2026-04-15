"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorMessage
          title="Something went wrong"
          message="We've been notified and are looking into it. Please try refreshing the page or going back."
        />
        <div className="mt-6 flex gap-3">
          <Button onClick={() => reset()} className="flex-1">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
