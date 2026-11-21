import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, TOOLS, type GuideLink } from "@/lib/guides";
import s from "../landing.module.css";

/**
 * Index of the public guides and the deadline calculator.
 *
 * Legal content: none of its own. Each entry says which part of § 47a-21(d)
 * the linked page reads; the pages themselves quote only the verified text in
 * LEGAL_REVIEW_47a-21.md. A test checks every guide route under
 * src/app/guides is listed here.
 */

const PATH = "/guides";
const TITLE = "Connecticut security deposit guides — Tribune";
const DESCRIPTION =
  "Tribune's guides to Connecticut's security deposit statute, Conn. Gen. Stat. § 47a-21(d): the deadline, the forwarding address, the itemized statement, and double damages. Each guide quotes the statute and links its sources.";

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

const cardLink: React.CSSProperties = { color: "inherit", textDecoration: "none", display: "block" };

function Cards({ items, testId }: { items: ReadonlyArray<GuideLink>; testId: string }) {
  return (
    <div className={s.lawGrid} data-testid={testId}>
      {items.map((g, i) => (
        <Link key={g.href} href={g.href} className={s.lawCard} style={cardLink}>
          <div className={s.lawSym}>{String(i + 1).padStart(2, "0")}</div>
          <h3 className={s.lawTitle}>{g.title} →</h3>
          <p className={s.lawBody}>{g.body}</p>
        </Link>
      ))}
    </div>
  );
}

export default function GuidesIndex() {
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
          <p className={s.label}>Guides · Conn. Gen. Stat. § 47a-21</p>
          <h1 className={s.heroH1}>
            Connecticut security deposits.
            <br />
            <em>What the statute says.</em>
          </h1>
          <p className={s.heroSub}>
            Each guide quotes subsection (d) of Connecticut&apos;s security deposit
            statute, reads one part of it, and lists what it leaves out. Sources
            are linked on every page.
          </p>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-light)", maxWidth: "640px" }}>
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <section className={s.sectionCream} id="guides">
        <div className={s.wrap}>
          <p className={s.label}>01 / Guides</p>
          <h2 className={s.h2}>
            One question <em>per page.</em>
          </h2>
          <Cards items={GUIDES} testId="guide-list" />
        </div>
      </section>

      <section className={s.sectionFaq} id="tools">
        <div className={s.wrap}>
          <p className={s.label}>02 / Tools</p>
          <h2 className={s.h2}>
            Work out <em>your dates.</em>
          </h2>
          <Cards items={TOOLS} testId="tool-list" />
        </div>
      </section>

      <section className={s.sectionCream} id="tribune">
        <div className={s.wrap}>
          <p className={s.label}>03 / How Tribune works</p>
          <h2 className={s.h2}>
            Tribune prepares the letters. <em>You approve each one.</em>
          </h2>
          <p style={{ maxWidth: "720px", fontSize: "17px", lineHeight: 1.75, color: "var(--ink-mid)", margin: "0 0 20px" }}>
            Tribune is a document-preparation service for Connecticut residential
            tenants. It prepares demand letters citing § 47a-21 from your case
            details. You read each letter and approve it in the app before Tribune
            sends it to your landlord in your name.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={INTAKE_HREF} className={s.btnDark}>
              Start your free case review →
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
