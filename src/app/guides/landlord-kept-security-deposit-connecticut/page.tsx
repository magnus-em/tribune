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
 * Guide for the search "landlord kept my security deposit" (Connecticut).
 *
 * Legal content: restates only the verified text in LEGAL_REVIEW_47a-21.md
 * (via src/lib/statute.ts). It maps what a tenant received against the words
 * of § 47a-21(d) and does not say whether a given landlord complied. Anything
 * the review did not verify — the interest rate, how specific an itemization
 * must be, which charges count as damages, other subsections, case law, court
 * procedure — is listed as "not covered" rather than summarized.
 */

const PATH = "/guides/landlord-kept-security-deposit-connecticut";
const TITLE = "Connecticut landlord kept your security deposit? What § 47a-21 says — Tribune";
const DESCRIPTION =
  "Your Connecticut landlord kept all or part of your security deposit. What Conn. Gen. Stat. § 47a-21(d) requires a landlord to deliver, by when, and what the statute says a landlord is liable for if it does not. Quoted from the statute, with sources.";

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
 * What a tenant may have received, set against the statute's words. Each body
 * says what the text of (d) requires; none says whether a landlord complied.
 */
const SITUATIONS = [
  {
    title: "Nothing arrived",
    body: "Subsection (d) requires the landlord to deliver one of two things by the deadline: the full deposit plus accrued interest, or the balance plus a written statement itemizing the nature and amount of the damages deducted. The deadline depends on two dates, covered in section 01.",
  },
  {
    title: "Part of the deposit, with no written statement",
    body: "Under option (B), the balance is delivered “together with a written statement itemizing the nature and amount of such damages.” The statute ties the statement to the deduction.",
  },
  {
    title: "Part of the deposit, with a list of deductions",
    body: "The statute requires the statement to itemize the nature and amount of the damages. The verified statute text does not say how detailed a statement must be, or which charges count as damages.",
  },
  {
    title: "The full deposit, but no interest",
    body: "Both options in (d) include accrued interest. The statute sets a separate liability where the only violation is failing to deliver the accrued interest (section 03). This guide does not cover the interest rate.",
  },
];

const RECORDS = [
  {
    title: "When the tenancy ended",
    body: `The ${STATUTE_DAYS}-day clock in subsection (d) runs from the termination of the tenancy.`,
  },
  {
    title: "When the landlord got your forwarding address in writing",
    body: "The 15-day clock runs from the landlord receiving written notification of the forwarding address. A copy of that notice, and its date, is the record that clock depends on.",
  },
  {
    title: "What the landlord sent, and when",
    body: "Any check, partial refund, or written statement of deductions, and the date it arrived.",
  },
  {
    title: "What you paid as a deposit",
    body: "The lease or a receipt showing the security deposit amount. The statute’s liability provision is measured against the deposit the tenant paid.",
  },
];

const NOT_COVERED = [
  "Whether a particular landlord complied with the statute.",
  "The interest rate on security deposits and how interest accrues.",
  "How detailed a statement must be to count as “itemizing the nature and amount” of damages, and which charges count as damages.",
  "How days are counted (weekends, holidays, mail delivery).",
  "The other subsections of § 47a-21, court procedure, and court decisions interpreting the statute.",
];

export default function LandlordKeptDepositGuide() {
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
            Your Connecticut landlord
            <br />
            kept your deposit.
            <br />
            <em>What the statute says.</em>
          </h1>
          <p className={s.heroSub}>
            Connecticut&apos;s security deposit statute sets a deadline for the
            landlord, says what has to arrive by then, and says what a landlord is
            liable for when it does not comply. This page sets what you received
            against the statute&apos;s words. It quotes the statute first, then
            restates it in plain terms.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="deadline">
        <div className={s.wrap}>
          <p className={s.label}>01 / The deadline</p>
          <h2 className={s.h2}>
            Two clocks. <em>The later one controls.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            In plain terms, the landlord&apos;s deadline is whichever of these is
            later:
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
            A forwarding address the landlord received late, in writing, can make
            the 15-day date the later one. To work out the dates for your tenancy, use the{" "}
            <Link href="/tools/deposit-deadline" style={{ color: "var(--blue)" }}>
              deposit deadline calculator
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="what-arrived">
        <div className={s.wrap}>
          <p className={s.label}>02 / What arrived</p>
          <h2 className={s.h2}>
            Four situations, <em>against the statute&apos;s words.</em>
          </h2>
          <p style={proseStyle}>
            By the deadline, subsection (d) requires the landlord to deliver
            either (A) the full deposit plus accrued interest, or (B) the balance
            after deducting damages, together with a written statement itemizing
            the nature and amount of those damages.
          </p>
          <div className={s.lawGrid} data-testid="situations">
            {SITUATIONS.map((o, i) => (
              <div key={o.title} className={s.lawCard}>
                <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className={s.lawTitle}>{o.title}</h3>
                <p className={s.lawBody}>{o.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...proseStyle, marginTop: "24px" }}>
            Whether a landlord complied depends on the facts of each case, including
            the dates in section 01.
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="damages">
        <div className={s.wrap}>
          <p className={s.label}>03 / If the landlord does not comply</p>
          <h2 className={s.h2}>
            What the statute <em>says the landlord is liable for.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DAMAGES_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>In plain terms, the statute provides:</p>
          <ul style={listStyle}>
            <li style={{ marginBottom: "8px" }}>
              A landlord who violates any provision of the subsection is liable for
              twice the amount of the security deposit the tenant paid.
            </li>
            <li>
              If the only violation is failing to deliver the accrued interest, the
              liability is ten dollars or twice the accrued interest, whichever is
              greater.
            </li>
          </ul>
          <p style={proseStyle}>
            Whether either applies depends on the facts of each case.
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="records">
        <div className={s.wrap}>
          <p className={s.label}>04 / The records the statute turns on</p>
          <h2 className={s.h2}>Four records.</h2>
          <div className={s.lawGrid}>
            {RECORDS.map((r, i) => (
              <div key={r.title} className={s.lawCard}>
                <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className={s.lawTitle}>{r.title}</h3>
                <p className={s.lawBody}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.sectionCream} id="not-covered">
        <div className={s.wrap}>
          <p className={s.label}>05 / Not covered here</p>
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
            walks through the same subsection section by section. The full text of
            § 47a-21 is at the sources below.
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

      <section className={s.sectionFaq} id="tribune">
        <div className={s.wrap}>
          <p className={s.label}>06 / How Tribune works</p>
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
            <Link href="/guides/connecticut-security-deposit-law">CT deposit law guide</Link>
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
