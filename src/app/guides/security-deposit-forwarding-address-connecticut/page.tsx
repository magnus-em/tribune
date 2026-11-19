import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { STATUTE_DAYS } from "@/lib/constants";
import { computeDepositDeadline, FORWARDING_ADDRESS_DAYS } from "@/lib/deadline-calculator";
import {
  STATUTE_CITATION,
  STATUTE_DAMAGES_QUOTE,
  STATUTE_DEADLINE_QUOTE,
  STATUTE_SOURCES,
} from "@/lib/statute";
import s from "../../landing.module.css";

/**
 * Guide for the search "security deposit forwarding address" (Connecticut).
 *
 * Legal content: restates only the verified text in LEGAL_REVIEW_47a-21.md
 * (via src/lib/statute.ts). It points to the words of § 47a-21(d) that mention
 * the forwarding address and shows how the two deadline branches combine, using
 * the same calendar-day math as /tools/deposit-deadline. The review did not
 * verify what counts as "written notification", how it must be sent, how
 * receipt is shown, what happens when no forwarding address is given, day
 * counting, the interest rate, other subsections, or case law. Those are listed
 * as "not covered" rather than summarized.
 */

const PATH = "/guides/security-deposit-forwarding-address-connecticut";
const TITLE = "Forwarding address and your Connecticut security deposit: what § 47a-21 says — Tribune";
const DESCRIPTION =
  "How the tenant's forwarding address figures in Conn. Gen. Stat. § 47a-21(d): the 15-day clock that starts when the landlord receives it in writing, how it combines with the 21-day clock, and where the deposit is delivered. Quoted from the statute, with sources.";

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
 * The words of (d) that involve the forwarding address. Each title is a
 * verbatim fragment of STATUTE_DEADLINE_QUOTE (tested); each body restates it.
 */
const WORDS = [
  {
    title: "“Not later than twenty-one days after termination of a tenancy”",
    body: `The first clock: ${STATUTE_DAYS} days after the tenancy ends.`,
  },
  {
    title: "“fifteen days after receiving written notification of such tenant's forwarding address”",
    body: `The second clock: ${FORWARDING_ADDRESS_DAYS} days after the landlord receives written notification of the forwarding address. It runs from the landlord receiving the notice.`,
  },
  {
    title: "“whichever is later”",
    body: "Of the two dates, the later one is the deadline.",
  },
  {
    title: "“at such forwarding address”",
    body: "The landlord delivers the deposit, or the balance and the written statement, to the tenant or former tenant at the forwarding address.",
  },
];

/** Worked examples, computed with the same function as the calculator. */
const EXAMPLE_END = "2026-05-31";
const EXAMPLES = [
  { label: "Notice received before the tenancy ends", forwarding: "2026-05-25" },
  { label: "Notice received after the tenancy ends", forwarding: "2026-06-15" },
].map((e) => {
  const r = computeDepositDeadline({
    tenancy_end_date: EXAMPLE_END,
    forwarding_address_received_date: e.forwarding,
  });
  if (!r.ok || !r.forwarding_branch_date) throw new Error("example dates must be valid");
  return { ...e, result: r };
});
const EXAMPLE_NO_NOTICE = computeDepositDeadline({ tenancy_end_date: EXAMPLE_END });
if (!EXAMPLE_NO_NOTICE.ok) throw new Error("example dates must be valid");
const NO_NOTICE = EXAMPLE_NO_NOTICE;

const fmt = (iso: string) => format(parseISO(iso), "MMMM d, yyyy");

const RECORDS = [
  {
    title: "The date the tenancy ended",
    body: `The ${STATUTE_DAYS}-day clock runs from the termination of the tenancy.`,
  },
  {
    title: "The written notice of the forwarding address",
    body: "The statute refers to written notification, so the written notice is the record: a copy of what was sent and the address it gave.",
  },
  {
    title: "When the landlord received it",
    body: `The ${FORWARDING_ADDRESS_DAYS}-day clock runs from the landlord receiving the notice, so the date of receipt is the date that clock depends on.`,
  },
  {
    title: "What arrived at that address, and when",
    body: "The statute says the landlord delivers at the forwarding address. What arrived there, and the date, is set against the deadline.",
  },
];

const NOT_COVERED = [
  "What counts as “written notification” (for example email, text message, a move-out form, or an address written in the lease).",
  "Whether the notice has to be sent a particular way, such as certified mail.",
  "How receipt of the notice is shown, or when a mailed notice counts as received.",
  "What happens to the deadline if no forwarding address is given, or if the address changes.",
  "Whether a particular landlord complied with the statute.",
  "How days are counted (weekends, holidays, mail delivery).",
  "The interest rate on security deposits and how interest accrues.",
  "The other subsections of § 47a-21, court procedure, and court decisions interpreting the statute.",
];

export default function ForwardingAddressGuide() {
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
            Your forwarding address
            <br />
            and your deposit.
            <br />
            <em>What the statute says.</em>
          </h1>
          <p className={s.heroSub}>
            Connecticut&apos;s security deposit statute mentions the tenant&apos;s
            forwarding address twice: once to start a second deadline clock, and
            once to say where the deposit is delivered. This page quotes those
            words and restates them in plain terms.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="words">
        <div className={s.wrap}>
          <p className={s.label}>01 / The words</p>
          <h2 className={s.h2}>
            The forwarding address <em>in § 47a-21(d).</em>
          </h2>
          <blockquote style={quoteStyle} data-testid="deadline-quote">
            &ldquo;{STATUTE_DEADLINE_QUOTE}&rdquo;
            <cite style={quoteCiteStyle}>{STATUTE_CITATION}</cite>
          </blockquote>
          <p style={proseStyle}>Read phrase by phrase:</p>
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
            The verified statute text does not say what form the written
            notification takes or how it is sent. Whether a notice counts depends
            on the facts of each case.
          </p>
        </div>
      </section>

      <section className={s.sectionFaq} id="two-clocks">
        <div className={s.wrap}>
          <p className={s.label}>02 / Two clocks</p>
          <h2 className={s.h2}>
            The later date <em>is the deadline.</em>
          </h2>
          <p style={proseStyle}>
            In plain terms, the landlord&apos;s deadline is whichever of these is
            later:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: "8px" }}>
              {STATUTE_DAYS} days after the tenancy ends, or
            </li>
            <li>
              {FORWARDING_ADDRESS_DAYS} days after the landlord receives written
              notification of the tenant&apos;s forwarding address.
            </li>
          </ul>
          <p style={proseStyle}>
            Because the later date controls, a forwarding notice received late
            enough moves the deadline later. A notice received earlier does not
            move it earlier than {STATUTE_DAYS} days after the tenancy ends.
          </p>
          <p style={proseStyle}>
            Two examples, for a tenancy that ended {fmt(EXAMPLE_END)} (calendar
            days, not adjusted for weekends or holidays):
          </p>
          <div className={s.lawGrid} data-testid="examples">
            {EXAMPLES.map((e) => (
              <div key={e.label} className={s.lawCard}>
                <h3 className={s.lawTitle}>{e.label}</h3>
                <p className={s.lawBody}>
                  Landlord receives the written notice {fmt(e.forwarding)}.{" "}
                  {STATUTE_DAYS}-day clock: {fmt(e.result.tenancy_branch_date)}.{" "}
                  {FORWARDING_ADDRESS_DAYS}-day clock:{" "}
                  {fmt(e.result.forwarding_branch_date as string)}. The later date,{" "}
                  <strong>{fmt(e.result.deadline)}</strong>, is the deadline.
                </p>
              </div>
            ))}
          </div>
          <p style={{ ...proseStyle, marginTop: "24px" }} data-testid="crossover">
            For that tenancy, a notice received after {fmt(NO_NOTICE.forwarding_later_after)}{" "}
            sets a deadline later than {fmt(NO_NOTICE.tenancy_branch_date)}. The{" "}
            <Link href="/tools/deposit-deadline" style={{ color: "var(--blue)" }}>
              deposit deadline calculator
            </Link>{" "}
            works out both dates for any tenancy.
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
            Whether either liability applies depends on the facts of each case.
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
            walks through the same subsection section by section;{" "}
            <Link href="/guides/landlord-kept-security-deposit-connecticut" style={{ color: "var(--blue)" }}>
              Landlord kept your deposit?
            </Link>{" "}
            sets what arrived against it; and{" "}
            <Link href="/guides/itemized-statement-of-damages-connecticut" style={{ color: "var(--blue)" }}>
              The itemized statement of damages
            </Link>{" "}
            covers the written statement. The full text of § 47a-21 is at the
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
            <Link href="/guides/itemized-statement-of-damages-connecticut">Itemized statement of damages</Link>
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
