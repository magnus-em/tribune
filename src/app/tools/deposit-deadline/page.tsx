import type { Metadata } from "next";
import Link from "next/link";
import { STATUTE_DAYS } from "@/lib/constants";
import { FORWARDING_ADDRESS_DAYS } from "@/lib/deadline-calculator";
import { STATUTE_CITATION, STATUTE_DEADLINE_QUOTE, STATUTE_SOURCES } from "@/lib/statute";
import { DeadlineCalculator } from "./calculator";
import s from "../../landing.module.css";

/**
 * Connecticut security deposit return-deadline calculator.
 *
 * Legal content: restates only the verified § 47a-21(d) deadline text in
 * LEGAL_REVIEW_47a-21.md (via src/lib/statute.ts). The math is in
 * src/lib/deadline-calculator.ts and runs in the browser; nothing is stored.
 */

const PATH = "/tools/deposit-deadline";
const TITLE = "Connecticut security deposit deadline calculator (§ 47a-21) — Tribune";
const DESCRIPTION =
  "Enter the date your Connecticut tenancy ended to see when your landlord had to return your security deposit under Conn. Gen. Stat. § 47a-21(d): 21 days after the tenancy ends or 15 days after receiving your forwarding address in writing, whichever is later.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    siteName: "Tribune",
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    locale: "en_US",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const INTAKE_HREF = "/login?next=/dashboard/new-case";

const DISCLAIMER =
  "Tribune provides information about Connecticut tenant rights and prepares documents. Tribune is not a law firm, and nothing on this page is legal advice. All correspondence is signed by the tenant.";

const quoteStyle: React.CSSProperties = {
  margin: "0 0 20px",
  padding: "20px 24px",
  background: "var(--white)",
  borderLeft: "3px solid var(--blue)",
  fontSize: "16px",
  lineHeight: 1.7,
  color: "var(--ink-mid)",
};

const quoteCiteStyle: React.CSSProperties = {
  display: "block",
  marginTop: "12px",
  fontFamily: "var(--mono)",
  fontSize: "11px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-light)",
  fontStyle: "normal",
};

const proseStyle: React.CSSProperties = {
  maxWidth: "720px",
  fontSize: "17px",
  lineHeight: 1.75,
  color: "var(--ink-mid)",
  margin: "0 0 20px",
};

const listStyle: React.CSSProperties = { ...proseStyle, paddingLeft: "20px", listStyle: "disc" };

const LIMITS = [
  "It counts calendar days. It does not adjust for weekends or holidays, and it does not say how a court counts days.",
  "It uses the dates you enter. When a tenancy terminated, and when a landlord received a forwarding address, can depend on the facts.",
  "It does not say whether a landlord complied with the statute. That depends on what was delivered, when, and where.",
  "It does not calculate accrued interest on the deposit.",
];

export default function DepositDeadlinePage() {
  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/" className={s.navLogo}>
            Tribune
          </Link>
          <Link href={INTAKE_HREF} className={s.navCta}>
            Start free review →
          </Link>
        </div>
      </nav>

      <section className={s.hero}>
        <div className={s.wrap}>
          <p className={s.label}>Tool · Conn. Gen. Stat. § 47a-21(d)</p>
          <h1 className={s.heroH1}>
            When did your landlord
            <br />
            have to return
            <br />
            <em>your deposit?</em>
          </h1>
          <p className={s.heroSub}>
            Connecticut&apos;s statute gives the landlord {STATUTE_DAYS} days after
            the tenancy ends, or {FORWARDING_ADDRESS_DAYS} days after receiving your
            forwarding address in writing, whichever is later. Enter your dates to
            see the deadline. The math runs in your browser; nothing is stored or
            sent.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="calculator">
        <div className={s.wrap}>
          <p className={s.label}>01 / Your dates</p>
          <h2 className={s.h2}>Deadline calculator.</h2>
          <DeadlineCalculator intakeHref={INTAKE_HREF} />
        </div>
      </section>

      <section className={s.sectionFaq} id="statute">
        <div className={s.wrap}>
          <p className={s.label}>02 / The statute</p>
          <h2 className={s.h2}>
            Two clocks. <em>The later one controls.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            More on what the statute requires, and what it says happens when a
            landlord does not comply, is in the{" "}
            <Link href="/guides/connecticut-security-deposit-law" style={{ color: "var(--blue)" }}>
              Connecticut deposit law guide
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="limits">
        <div className={s.wrap}>
          <p className={s.label}>03 / What this calculator does not do</p>
          <h2 className={s.h2}>Its limits.</h2>
          <ul style={listStyle} data-testid="limits">
            {LIMITS.map((l) => (
              <li key={l} style={{ marginBottom: "8px" }}>
                {l}
              </li>
            ))}
          </ul>
          <p style={{ ...proseStyle, fontSize: "14px", color: "var(--ink-light)" }} data-testid="sources">
            Sources:{" "}
            {STATUTE_SOURCES.map((src, i) => (
              <span key={src.href}>
                {i > 0 && " · "}
                <a href={src.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                  {src.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="tribune">
        <div className={s.wrap}>
          <p className={s.label}>04 / How Tribune works</p>
          <h2 className={s.h2}>
            Tribune prepares the letters. <em>You approve each one.</em>
          </h2>
          <p style={proseStyle}>
            Tribune is a document-preparation service for Connecticut residential
            tenants. It prepares demand letters citing § 47a-21 from your case
            details. You read each letter and approve it in the app before Tribune
            sends it to your landlord in your name.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={INTAKE_HREF} className={s.btnDark}>
              Start your free case review →
            </Link>
            <Link href="/moved-out" className={s.btnPrimary}>
              Moved out this summer?
            </Link>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <strong>Tribune</strong>
            <p>Security deposit recovery for Connecticut tenants.</p>
          </div>
          <div className={s.footerLinks}>
            <Link href={INTAKE_HREF}>Open a case</Link>
            <Link href="/">Home</Link>
            <Link href="/guides/connecticut-security-deposit-law">CT deposit law guide</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <p className={s.footerFine} data-testid="disclaimer">
            {DISCLAIMER}
          </p>
          <p className={s.footerFine}>© 2026 Tribune Services, Inc. · Not a law firm · Connecticut only</p>
        </div>
      </footer>
    </div>
  );
}
