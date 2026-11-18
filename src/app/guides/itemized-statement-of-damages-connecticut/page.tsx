import type { Metadata } from "next";
import Link from "next/link";
import { STATUTE_DAYS } from "@/lib/constants";
import {
  STATUTE_CITATION,
  STATUTE_DAMAGES_QUOTE,
  STATUTE_DEADLINE_QUOTE,
  STATUTE_ITEMIZATION_QUOTE,
  STATUTE_SOURCES,
} from "@/lib/statute";
import s from "../../landing.module.css";

/**
 * Guide for the search "itemized list of damages" / "itemized statement"
 * (Connecticut security deposits).
 *
 * Legal content: restates only the verified text in LEGAL_REVIEW_47a-21.md
 * (via src/lib/statute.ts). It points to the words of § 47a-21(d) that govern
 * the written statement and does not say whether any statement complies. The
 * review did not verify how detailed an itemization must be, which charges count
 * as damages (wear and tear, cleaning, painting), whether receipts or estimates
 * are required, the interest rate, other subsections, or case law. Those are
 * listed as "not covered" rather than summarized.
 */

const PATH = "/guides/itemized-statement-of-damages-connecticut";
const TITLE = "Itemized statement of damages for a Connecticut security deposit: what § 47a-21 says — Tribune";
const DESCRIPTION =
  "Your Connecticut landlord deducted damages from your security deposit. What Conn. Gen. Stat. § 47a-21(d) says about the written statement itemizing those damages: what it names, when and where it is due, and what the statute says a landlord is liable for. Quoted from the statute, with sources.";

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
 * The parts of the statement and its delivery that the words of (d) name.
 * Each body restates the statute's words; none says whether a statement
 * that lacks one complies.
 */
const WORDS = [
  {
    title: "“a written statement”",
    body: "The statute calls for a statement in writing.",
  },
  {
    title: "“itemizing the nature and amount of such damages”",
    body: "The statement itemizes both what the damages are (their nature) and how much they are (their amount).",
  },
  {
    title: "“together with”",
    body: "Under option (B), the statement is delivered together with the balance of the deposit and accrued interest.",
  },
  {
    title: "“at such forwarding address”",
    body: "The landlord delivers to the tenant or former tenant at the forwarding address.",
  },
  {
    title: "“Not later than …”",
    body: "The balance and the statement are due by the same deadline (section 02).",
  },
];

const RECORDS = [
  {
    title: "The statement itself",
    body: "The original, and the envelope or email it came in. The statute refers to a written statement, so the written document is the record.",
  },
  {
    title: "When it arrived",
    body: "The date the statement and any payment reached you, set against the deadline in section 02.",
  },
  {
    title: "When the landlord got your forwarding address in writing",
    body: "The 15-day clock runs from the landlord receiving written notification of the forwarding address. A copy of that notice, and its date, is the record that clock depends on.",
  },
  {
    title: "What you paid as a deposit",
    body: "The lease or a receipt showing the security deposit amount. The statute’s liability provision is measured against the deposit the tenant paid.",
  },
];

const NOT_COVERED = [
  "Whether a particular statement complies with the statute.",
  "How detailed a statement must be to count as “itemizing the nature and amount” of damages.",
  "Which charges count as damages, including normal wear and tear, cleaning, and painting.",
  "Whether a landlord has to attach receipts, invoices, estimates, or photos.",
  "The interest rate on security deposits and how interest accrues.",
  "How days are counted (weekends, holidays, mail delivery).",
  "The other subsections of § 47a-21, court procedure, and court decisions interpreting the statute.",
];

export default function ItemizedStatementGuide() {
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
            The itemized statement
            <br />
            of damages.
            <br />
            <em>What the statute says.</em>
          </h1>
          <p className={s.heroSub}>
            When a Connecticut landlord keeps part of a security deposit for
            damages, the statute says a written statement itemizing those damages
            comes with the rest. This page quotes the words of the statute that
            govern that statement, then restates them in plain terms.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="requirement">
        <div className={s.wrap}>
          <p className={s.label}>01 / The requirement</p>
          <h2 className={s.h2}>
            Deductions come <em>with a written statement.</em>
          </h2>
          <blockquote style={quoteStyle} data-testid="itemization-quote">
            &ldquo;…{STATUTE_ITEMIZATION_QUOTE}.&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}, option (B)</cite>
          </blockquote>
          <p style={proseStyle}>
            Subsection (d) gives the landlord two options: (A) deliver the full
            deposit plus accrued interest, or (B) deliver the balance after
            deducting damages. Under option (B), the balance comes together with a
            written statement itemizing the nature and amount of those damages.
          </p>
          <p style={proseStyle}>Read word by word, the subsection names these parts:</p>
          <div className={s.lawGrid} data-testid="statute-words">
            {WORDS.map((w, i) => (
              <div key={w.title} className={s.lawCard}>
                <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className={s.lawTitle}>{w.title}</h3>
                <p className={s.lawBody}>{w.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...proseStyle, marginTop: "24px" }}>
            The verified statute text does not say how detailed a statement must
            be, or which charges count as damages. Whether a statement complies
            depends on the facts of each case.
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="deadline">
        <div className={s.wrap}>
          <p className={s.label}>02 / The deadline</p>
          <h2 className={s.h2}>
            Two clocks. <em>The later one controls.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            In plain terms, the statement and the balance are due by whichever of
            these is later:
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
            The itemized statement is part of the same subsection. Whether either
            liability applies depends on the facts of each case.
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
            walks through the same subsection section by section, and{" "}
            <Link href="/guides/landlord-kept-security-deposit-connecticut" style={{ color: "var(--blue)" }}>
              Landlord kept your deposit?
            </Link>{" "}
            sets what arrived against it. The full text of § 47a-21 is at the
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
            <Link href="/guides/landlord-kept-security-deposit-connecticut">Landlord kept your deposit?</Link>
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
