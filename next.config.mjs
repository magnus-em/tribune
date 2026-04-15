import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  // Upload source maps for readable stack traces
  silent: !process.env.CI,
  // Hide source maps from clients
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
