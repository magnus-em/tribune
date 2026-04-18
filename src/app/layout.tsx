import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/lib/analytics/posthog";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tribune — Security Deposit Recovery",
  description:
    "Connecticut tenants: your landlord had 21 days. Tribune prepares your demand letters and handles your case on contingency. You pay nothing unless we recover.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${ibmPlexSerif.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <NavigationProgress />
        <PostHogProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  );
}
