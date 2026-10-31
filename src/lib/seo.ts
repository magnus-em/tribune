/**
 * SEO helpers: canonical site URL, the public routes that belong in the
 * sitemap, the paths crawlers should skip, and JSON-LD builders.
 *
 * Structured data uses `Organization` + `ProfessionalService`, not
 * `LegalService`. schema.org defines LegalService as a business providing
 * "legally-oriented services, advice and representation", which contradicts
 * the not-a-law-firm, information-not-advice posture (CLAUDE.md).
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org").replace(/\/+$/, "");

export const SITE_NAME = "Tribune";

export const SITE_DESCRIPTION =
  "Connecticut tenants: your landlord had 21 days. Tribune prepares your demand letters and handles your case on contingency. You pay nothing unless Tribune recovers your deposit.";

/** Public, indexable pages. Every entry must be a real route under src/app. */
export const PUBLIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/moved-out", changeFrequency: "monthly", priority: 0.8 },
];

/** Authenticated, transactional, or internal paths crawlers should skip. */
export const DISALLOWED_PATHS: ReadonlyArray<string> = [
  "/admin",
  "/dashboard",
  "/api",
  "/auth",
  "/login",
  "/demo",
];

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A legal-information and document-preparation service for Connecticut residential tenants recovering security deposits. Not a law firm.",
    areaServed: { "@type": "State", name: "Connecticut" },
  };
}

export function faqPageJsonLd(faq: ReadonlyArray<{ q: string; a: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Serialize for a <script type="application/ld+json"> tag without allowing `</script>` breakout. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
