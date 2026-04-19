import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Tribune",
  description: "Contact information for Tribune.",
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f3ea",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 24px",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#ffffff",
          border: "1px solid #d9d5cb",
          padding: "48px 48px",
        }}
      >
        {/* Brand */}
        <div
          style={{
            fontFamily: "var(--font-ibm-plex-serif, Georgia, serif)",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#0a0a08",
            marginBottom: 4,
          }}
        >
          <span style={{ color: "#b8361f", fontStyle: "italic" }}>§ </span>
          Tribune
        </div>
        <div
          style={{
            fontFamily: "var(--font-ibm-plex-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6e6a5a",
            marginBottom: 40,
          }}
        >
          usetribune.org
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #d9d5cb", marginBottom: 36 }} />

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: "#0a0a08",
            lineHeight: 1.65,
            marginBottom: 36,
          }}
        >
          Tribune is a legal-information and document-preparation service that
          helps Connecticut residential tenants recover wrongfully withheld
          security deposits under CT § 47a-21. Tribune is operated by Magnus
          Melbourne.
        </p>

        {/* Contact details */}
        <dl style={{ display: "grid", rowGap: 20 }}>
          <div>
            <dt
              style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6e6a5a",
                marginBottom: 4,
              }}
            >
              Operator
            </dt>
            <dd style={{ fontSize: 15, color: "#0a0a08", margin: 0 }}>
              Magnus Melbourne
            </dd>
          </div>

          <div>
            <dt
              style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6e6a5a",
                marginBottom: 4,
              }}
            >
              Address
            </dt>
            <dd style={{ fontSize: 15, color: "#0a0a08", margin: 0, lineHeight: 1.5 }}>
              25 High Street<br />
              New Haven, CT 06510<br />
              United States
            </dd>
          </div>

          <div>
            <dt
              style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6e6a5a",
                marginBottom: 4,
              }}
            >
              Email
            </dt>
            <dd style={{ fontSize: 15, color: "#0a0a08", margin: 0 }}>
              <a
                href="mailto:magnus@usetribune.org"
                style={{ color: "#b8361f", textDecoration: "none" }}
              >
                magnus@usetribune.org
              </a>
            </dd>
          </div>

          <div>
            <dt
              style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6e6a5a",
                marginBottom: 4,
              }}
            >
              Website
            </dt>
            <dd style={{ fontSize: 15, color: "#0a0a08", margin: 0 }}>
              https://usetribune.org
            </dd>
          </div>
        </dl>

        <div style={{ borderTop: "1px solid #d9d5cb", marginTop: 36, paddingTop: 24 }}>
          <p style={{ fontSize: 13, color: "#6e6a5a", lineHeight: 1.6, margin: 0 }}>
            For official correspondence regarding Tribune, please use the
            contact information listed on this page.
          </p>
        </div>
      </div>
    </main>
  );
}
