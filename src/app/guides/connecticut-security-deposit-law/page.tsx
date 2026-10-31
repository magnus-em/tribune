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
 * Guide to Connecticut's security deposit statute.
 *
 * Legal content: restates only the verified text in LEGAL_REVIEW_47a-21.md
 * (via src/lib/statute.ts). Anything the review did not verify — the interest
 * rate, how specific an itemization must be, other subsections, case law — is
 * listed as "not covered" rather than summarized.
 */

const PATH = "/guides/connecticut-security-deposit-law";
const TITLE = "Connecticut security deposit law (§ 47a-21), in the statute's words — Tribune";
const DESCRIPTION =
  "What Conn. Gen. Stat. § 47a-21(d) says about when a landlord must return a security deposit, what an itemized statement is, and what the statute says happens when a landlord does not comply. Quoted from the statute, with sources.";

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

const DELIVERY_OPTIONS = [
  {
    sym: "A",
    title: "The full deposit, plus interest",
    body: "The full amount of the security deposit the tenant paid, plus accrued interest.",
  },
  {
    sym: "B",
    title: "The balance, plus an itemized statement",
    body: "The balance of the deposit and accrued interest after deducting damages the landlord suffered, together with a written statement itemizing the nature and amount of those damages.",
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
    body: "Any check, partial refund, or written statement of deductions, and the date it arrived. The statute measures delivery against the deadline and requires the itemized statement to accompany any deduction.",
  },
];

const NOT_COVERED = [
  "The interest rate on security deposits and how interest accrues.",
  "How detailed a statement must be to count as “itemizing the nature and amount” of damages.",
  "The other subsections of § 47a-21.",
  "Court decisions interpreting the statute.",
];

export default function ConnecticutDepositLawGuide() {
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
            Connecticut security
            <br />
            deposit law,
            <br />
            <em>in the statute&apos;s words.</em>
          </h1>
          <p className={s.heroSub}>
            When a Connecticut landlord has to return a security deposit, what has
            to come with any deduction, and what the statute says happens when a
            landlord does not comply. Each section quotes the statute first, then
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
            The statute says the deposit is delivered to the tenant or former
            tenant at that forwarding address.
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="delivery">
        <div className={s.wrap}>
          <p className={s.label}>02 / What the landlord must deliver</p>
          <h2 className={s.h2}>One of two things.</h2>
          <p style={proseStyle}>By the deadline, subsection (d) requires the landlord to deliver either:</p>
          <div className={s.lawGrid}>
            {DELIVERY_OPTIONS.map((o) => (
              <div key={o.sym} className={s.lawCard}>
                <div className={s.lawSym}>({o.sym})</div>
                <h3 className={s.lawTitle}>{o.title}</h3>
                <p className={s.lawBody}>{o.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...proseStyle, marginTop: "24px" }}>
            Under option (B), the written statement goes together with the balance.
            The statute&apos;s words are &ldquo;itemizing the nature and amount of
            such damages.&rdquo;
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
          <p className={s.label}>04 / The dates the statute turns on</p>
          <h2 className={s.h2}>Three records.</h2>
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
            not summarize:
          </p>
          <ul style={listStyle} data-testid="not-covered">
            {NOT_COVERED.map((n) => (
              <li key={n} style={{ marginBottom: "8px" }}>
                {n}
              </li>
            ))}
          </ul>
          <p style={proseStyle}>
            The full text of § 47a-21 is at the sources below.
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
            <Link href="/moved-out">Moved out this summer</Link>
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
