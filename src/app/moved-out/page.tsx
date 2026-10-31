import type { Metadata } from "next";
import Link from "next/link";
import { CONTINGENCY_PCT, STATUTE_DAYS } from "@/lib/constants";
import {
  STATUTE_CITATION,
  STATUTE_DAMAGES_QUOTE,
  STATUTE_DEADLINE_QUOTE,
  STATUTE_SOURCES,
} from "@/lib/statute";
import { JsonLd } from "@/components/json-ld";
import { faqPageJsonLd } from "@/lib/seo";
import s from "../landing.module.css";

const TITLE = "Moved out this summer and never got your deposit back? — Tribune";
const DESCRIPTION =
  "What Connecticut's security deposit statute (§ 47a-21) says about the landlord's deadline, and how Tribune helps Connecticut tenants who moved out in the past year recover a withheld deposit.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/moved-out" },
  openGraph: {
    type: "article",
    siteName: "Tribune",
    title: TITLE,
    description: DESCRIPTION,
    url: "/moved-out",
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

const CHECKLIST = [
  {
    title: "Your move-out date",
    body: `The statute counts from the end of the tenancy: ${STATUTE_DAYS} days, or 15 days after the landlord receives your forwarding address in writing, whichever is later.`,
  },
  {
    title: "Your forwarding address",
    body: "The statute says the deposit is delivered to you at your forwarding address, and the 15-day branch runs from the landlord receiving it in writing.",
  },
  {
    title: "Your lease",
    body: "Tribune's case review needs the lease to confirm the tenancy and the deposit.",
  },
  {
    title: "Anything the landlord sent",
    body: "A check, a partial refund, or a list of deductions. The statute requires a written statement itemizing the nature and amount of any damages deducted.",
  },
  {
    title: "Your landlord's email",
    body: "Tribune sends the letters you approve by email, in your name.",
  },
];

const FAQ = [
  {
    q: "Is it too late if I moved out in May or June?",
    a: "Tribune accepts cases where the move-out was within the past year, so a summer 2026 move-out is within that window. Whether a specific landlord met the statute's deadline depends on the dates in that case.",
  },
  {
    q: "What does it cost?",
    a: `${CONTINGENCY_PCT}% of what is recovered, owed after your landlord pays you. If nothing is recovered, you owe nothing. Your landlord pays you directly; the money never passes through Tribune. Hard costs like certified mail or a court filing fee are passed through at cost and disclosed first.`,
  },
  {
    q: "Does anything get sent without me?",
    a: "No. Tribune prepares each letter from your case details. You read it, confirm it's accurate, and approve it in the app before Tribune sends it to your landlord in your name.",
  },
  {
    q: "Is Tribune a law firm?",
    a: "No. Tribune is a legal-information and document-preparation service. It explains what the statute says and prepares the documents; you decide whether to go ahead.",
  },
  {
    q: "Who can use Tribune?",
    a: "Residential tenants whose rental was in Connecticut. Tribune starts with New Haven.",
  },
];

export default function MovedOutPage() {
  return (
    <div className={s.page}>
      <JsonLd data={faqPageJsonLd(FAQ)} />
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
          <p className={s.label}>Connecticut · § 47a-21 · Summer 2026 move-outs</p>
          <h1 className={s.heroH1}>
            Moved out this summer
            <br />
            and never got your
            <br />
            <em>deposit back?</em>
          </h1>
          <p className={s.heroSub}>
            Connecticut law gives landlords a fixed deadline to return a security
            deposit or send an itemized list of deductions. Here is what the
            statute says, what to gather, and how Tribune works.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={INTAKE_HREF} className={s.btnPrimary}>
              Start your free case review →
            </Link>
          </div>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="statute">
        <div className={s.wrap}>
          <p className={s.label}>01 / What the statute says</p>
          <h2 className={s.h2}>
            The deadline, <em>in the statute&apos;s own words.</em>
          </h2>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            In short: {STATUTE_DAYS} days after the tenancy ends, or 15 days after
            the landlord receives your forwarding address in writing, whichever is
            later. By then the landlord has to return the full deposit with
            accrued interest, or return the balance with a written statement
            itemizing the nature and amount of the damages deducted.
          </p>
          <p style={proseStyle}>And what happens when a landlord doesn&apos;t:</p>
          <blockquote style={quoteStyle}>
            &ldquo;{STATUTE_DAMAGES_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>
            Whether that applies depends on the facts of each case. Tribune
            prepares the documentation; you assert the claim.
          </p>
          <p style={{ ...proseStyle, fontSize: "14px", color: "var(--ink-light)" }}>
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

      <section className={s.sectionFaq} id="gather">
        <div className={s.wrap}>
          <p className={s.label}>02 / What to gather</p>
          <h2 className={s.h2}>Five things to have on hand.</h2>
          <div className={s.lawGrid}>
            {CHECKLIST.map((item, i) => (
              <div key={item.title} className={s.lawCard}>
                <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className={s.lawTitle}>{item.title}</h3>
                <p className={s.lawBody}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.sectionCream} id="how">
        <div className={s.wrap}>
          <p className={s.label}>03 / How Tribune works</p>
          <h2 className={s.h2}>
            You approve every letter. <em>Tribune does the rest.</em>
          </h2>
          <ol style={{ ...proseStyle, paddingLeft: "20px", listStyle: "decimal" }}>
            <li style={{ marginBottom: "12px" }}>
              Tell Tribune about the tenancy and upload your lease. It takes about
              10 minutes.
            </li>
            <li style={{ marginBottom: "12px" }}>
              Tribune reviews the case and prepares a demand letter citing
              § 47a-21.
            </li>
            <li style={{ marginBottom: "12px" }}>
              You read the letter and approve it in the app. Tribune sends it to
              your landlord in your name, and tracks the reply.
            </li>
            <li>
              If your landlord pays, they pay you directly. You owe Tribune{" "}
              {CONTINGENCY_PCT}% of what was recovered. If nothing is recovered,
              you owe nothing.
            </li>
          </ol>
          <Link href={INTAKE_HREF} className={s.btnDark}>
            Start your free case review →
          </Link>
        </div>
      </section>

      <section className={s.sectionFaq} id="faq">
        <div className={s.wrap}>
          <p className={s.label}>04 / Questions</p>
          <h2 className={s.h2}>Common questions.</h2>
          <div>
            {FAQ.map((f) => (
              <details key={f.q} className={s.faqItem}>
                <summary className={s.faqQ}>{f.q}</summary>
                <p className={s.faqA}>{f.a}</p>
              </details>
            ))}
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
