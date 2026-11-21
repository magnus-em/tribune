import type { Metadata } from "next";
import Link from "next/link";
import { STATUTE_DAYS } from "@/lib/constants";
import {
  STATUTE_CITATION,
  STATUTE_DAMAGES_QUOTE,
  STATUTE_DEADLINE_QUOTE,
  STATUTE_SOURCES,
} from "@/lib/statute";
import s from "../../landing.module.css";

/**
 * Guide for the search "security deposit double damages Connecticut".
 *
 * Legal content: restates only the verified text in LEGAL_REVIEW_47a-21.md
 * (via src/lib/statute.ts). It reads the liability sentence of § 47a-21(d)
 * phrase by phrase and applies its arithmetic to illustrative figures. It does
 * not say whether any landlord is liable. LEGAL_REVIEW flags that whether the
 * full-deposit base applies where part of the deposit was returned, or the
 * landlord acted in good faith, is a case-law question; the page lists that,
 * how a court computes an award, court procedure, the interest rate, and case
 * law as "not covered" rather than summarizing them.
 */

const PATH = "/guides/security-deposit-double-damages-connecticut";
const TITLE = "Security deposit double damages in Connecticut: what § 47a-21 says — Tribune";
const DESCRIPTION =
  "What Conn. Gen. Stat. § 47a-21(d) says a Connecticut landlord who violates the security deposit subsection is liable for: twice the amount of the security deposit paid, and the separate rule when the only violation is accrued interest. Quoted from the statute, with sources.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "article",
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


/**
 * The phrases of the liability sentence. Each title is a verbatim fragment of
 * STATUTE_DAMAGES_QUOTE (tested); each body restates it without applying it.
 */
const PHRASES = [
  {
    title: "“Any landlord who violates any provision of this subsection”",
    body: "The liability attaches to a violation of any provision of subsection (d), not only one. The parts of (d) quoted on this page name the deadline, delivery at the forwarding address, the deposit and accrued interest, and the written statement itemizing damages.",
  },
  {
    title: "“shall be liable for”",
    body: "The sentence states what the landlord is liable for. It does not itself say how a tenant asserts that liability.",
  },
  {
    title: "“twice the amount of any security deposit paid by such tenant”",
    body: "The figure is measured against the security deposit the tenant paid, and the statute’s words double it.",
  },
  {
    title: "“if the only violation is the failure to deliver the accrued interest”",
    body: "A separate figure applies when the only violation is not delivering the accrued interest.",
  },
  {
    title: "“ten dollars or twice the amount of the accrued interest, whichever is greater”",
    body: "In that case the figure is the greater of ten dollars or twice the accrued interest.",
  },
];

/** Illustrative figures only, in integer cents. Not drawn from any case. */
const DEPOSIT_EXAMPLE_CENTS = 140_000;
const INTEREST_EXAMPLES_CENTS = [300, 800];
const TEN_DOLLARS_CENTS = 1_000;

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

const NOT_COVERED = [
  "Whether a particular landlord violated the subsection, or is liable.",
  "Whether amounts the landlord already returned are subtracted, and whether the landlord’s good faith matters. These are questions of how courts read the statute.",
  "How a court computes an award, and whether costs or other amounts are added.",
  "Court procedure: where and how a claim is filed, and the time limits for filing.",
  "The interest rate on security deposits and how interest accrues.",
  "How days are counted (weekends, holidays, mail delivery).",
  "The other subsections of § 47a-21 and court decisions interpreting the statute.",
];

export default function DoubleDamagesGuide() {
  const depositTwice = DEPOSIT_EXAMPLE_CENTS * 2;
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
          <p className={s.label}>Guide · Conn. Gen. Stat. § 47a-21</p>
          <h1 className={s.heroH1}>
            Double damages
            <br />
            on a security deposit.
            <br />
            <em>What the statute says.</em>
          </h1>
          <p className={s.heroSub}>
            Connecticut&apos;s security deposit statute says what a landlord who
            violates it is liable for. This page quotes that sentence, reads it
            phrase by phrase, and works through its arithmetic with example
            figures.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="liability">
        <div className={s.wrap}>
          <p className={s.label}>01 / The sentence</p>
          <h2 className={s.h2}>
            Twice the deposit. <em>In the statute&apos;s words.</em>
          </h2>
          <blockquote style={quoteStyle} data-testid="damages-quote">
            &ldquo;{STATUTE_DAMAGES_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>Read phrase by phrase:</p>
          <div className={s.lawGrid} data-testid="statute-phrases">
            {PHRASES.map((p, i) => (
              <div key={p.title} className={s.lawCard}>
                <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className={s.lawTitle}>{p.title}</h3>
                <p className={s.lawBody}>{p.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...proseStyle, marginTop: "24px" }}>
            Whether either figure applies depends on the facts of each case.
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="arithmetic">
        <div className={s.wrap}>
          <p className={s.label}>02 / The arithmetic</p>
          <h2 className={s.h2}>
            The statute&apos;s words, <em>applied to example figures.</em>
          </h2>
          <p style={proseStyle}>
            These figures are made up to show the arithmetic. They are not drawn
            from any case.
          </p>
          <ul style={listStyle} data-testid="examples">
            <li style={{ marginBottom: "8px" }} data-testid="example-deposit">
              Security deposit paid: {usd(DEPOSIT_EXAMPLE_CENTS)}. Twice that
              amount is {usd(depositTwice)}.
            </li>
            {INTEREST_EXAMPLES_CENTS.map((c) => {
              const twice = c * 2;
              const greater = Math.max(TEN_DOLLARS_CENTS, twice);
              return (
                <li key={c} style={{ marginBottom: "8px" }} data-testid="example-interest">
                  Only violation is the accrued interest, and the accrued interest
                  is {usd(c)}: twice that is {usd(twice)}, so the greater of ten
                  dollars and {usd(twice)} is {usd(greater)}.
                </li>
              );
            })}
          </ul>
          <p style={proseStyle}>
            The statute&apos;s words measure the first figure against the deposit
            paid, not against the amount the landlord kept. The verified statute text does not say
            whether amounts already returned are subtracted, or how a court
            computes an award; those are listed in section 04.
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="deadline">
        <div className={s.wrap}>
          <p className={s.label}>03 / What the subsection requires</p>
          <h2 className={s.h2}>
            The provisions <em>the sentence refers to.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            In plain terms, the landlord delivers either the full deposit plus
            accrued interest, or the balance plus accrued interest together with a
            written statement itemizing the damages, at the forwarding address, by
            whichever of these is later:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: "8px" }}>
              {STATUTE_DAYS} days after the tenancy ends, or
            </li>
            <li>
              15 days after the landlord receives written notification of the
              tenant&apos;s forwarding address.
            </li>
          </ul>
          <p style={proseStyle}>
            To work out the dates for your tenancy, use the{" "}
            <Link href="/tools/deposit-deadline" style={{ color: "var(--blue)" }}>
              deposit deadline calculator
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="not-covered">
        <div className={s.wrap}>
          <p className={s.label}>04 / Not covered here</p>
          <h2 className={s.h2}>What this guide leaves out.</h2>
          <p style={proseStyle}>
            This guide restates only the parts of § 47a-21(d) quoted above. It does
            not cover:
          </p>
          <ul style={listStyle} data-testid="not-covered">
            {NOT_COVERED.map((n) => (
              <li key={n} style={{ marginBottom: "8px" }}>
                {n}
              </li>
            ))}
          </ul>
          <p style={proseStyle}>
            The{" "}
            <Link href="/guides/connecticut-security-deposit-law" style={{ color: "var(--blue)" }}>
              Connecticut security deposit law guide
            </Link>{" "}
            walks through the same subsection section by section,{" "}
            <Link href="/guides/landlord-kept-security-deposit-connecticut" style={{ color: "var(--blue)" }}>
              Landlord kept your deposit?
            </Link>{" "}
            sets what arrived against it, and{" "}
            <Link href="/guides/itemized-statement-of-damages-connecticut" style={{ color: "var(--blue)" }}>
              the itemized statement guide
            </Link>{" "}
            reads the statement requirement. The full text of § 47a-21 is at the
            sources below.
          </p>
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

      <section className={s.sectionCream} id="tribune">
        <div className={s.wrap}>
          <p className={s.label}>05 / How Tribune works</p>
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
            <Link href="/tools/deposit-deadline" className={s.btnPrimary}>
              Deadline calculator
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
            <Link href="/guides">All guides</Link>
            <Link href="/guides/connecticut-security-deposit-law">CT deposit law guide</Link>
            <Link href="/guides/landlord-kept-security-deposit-connecticut">Landlord kept your deposit?</Link>
            <Link href="/guides/itemized-statement-of-damages-connecticut">Itemized statement of damages</Link>
            <Link href="/guides/security-deposit-forwarding-address-connecticut">Forwarding address</Link>
            <Link href="/tools/deposit-deadline">Deadline calculator</Link>
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
