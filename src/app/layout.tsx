import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/lib/analytics/posthog";
import { NavigationProgress } from "@/components/navigation-progress";
import { JsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationJsonLd } from "@/lib/seo";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

// Google Fonts are self-hosted (latin subset, files in ./fonts, SIL OFL 1.1).
// `next/font/google` fetched them at build time, and a bad response from Google
// failed `next build` on main (2026-10-31). Local files make the build offline.
const ibmPlexSerif = localFont({
  src: [
    { path: "./fonts/ibm-plex-serif-normal-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-serif-normal-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-serif-normal-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-serif-normal-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/ibm-plex-serif-italic-400.woff2", weight: "400", style: "italic" },
    { path: "./fonts/ibm-plex-serif-italic-500.woff2", weight: "500", style: "italic" },
    { path: "./fonts/ibm-plex-serif-italic-600.woff2", weight: "600", style: "italic" },
    { path: "./fonts/ibm-plex-serif-italic-700.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-ibm-plex-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-normal-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-normal-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-mono-normal-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-mono-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  adjustFontFallback: false,
});

// Variable font: wght 100–900 and the opsz axis.
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-normal-100-900.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/fraunces-italic-100-900.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

// Variable font: wght 300–600.
const dmSans = localFont({
  src: "./fonts/dm-sans-normal-300-600.woff2",
  weight: "300 600",
  style: "normal",
  variable: "--font-dm-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const spaceMono = localFont({
  src: [
    { path: "./fonts/space-mono-normal-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/space-mono-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-mono",
  display: "swap",
  adjustFontFallback: false,
});

const DEFAULT_TITLE = "Tribune — Security Deposit Recovery";

// No canonical or og:url here: every page would inherit them and point at "/".
// Pages that want a canonical set it themselves.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${ibmPlexSerif.variable} ${ibmPlexMono.variable} ${fraunces.variable} ${dmSans.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <NavigationProgress />
        <PostHogProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  );
}
