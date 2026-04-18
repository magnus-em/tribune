/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import s from "./landing.module.css";

export default function LandingPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
  }, []);

  const caseHref = authed ? "/dashboard/new-case" : "/login?next=/dashboard/new-case";

  return (
    <div className={s.page}>
      {/* Docket bar */}
      <div className={s.docket}>
        <span><b>Case file</b> · Tenant-side · open intake</span>
        <span>Conn. Gen. Stat. § 47a-21 · Residential deposits</span>
        <span>Not a law firm · Information only</span>
      </div>

      {/* Nav */}
      <nav className={s.nav}>
        <Link href="/" className={s.brand}>Tribune</Link>
        <div className={s.navLinks}>
          <a href="#playbook">The Playbook</a>
          <a href="#rights">Your Rights</a>
          <a href="#process">Process</a>
          <a href="#faq">Q&A</a>
        </div>
        {authed ? (
          <Link href="/dashboard" className={s.navCta}>Dashboard →</Link>
        ) : (
          <Link href={caseHref} className={s.navCta}>Open a case →</Link>
        )}
      </nav>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroWrap}>
          <div className={s.heroLn}>
            {Array.from({ length: 13 }, (_, i) => (
              <span key={i}>{String(i + 1).padStart(2, "0")}</span>
            ))}
          </div>
          <div>
            <div className={s.caseCaption}>
              <span><b>The matter</b> · residential security deposit</span>
              <span><b>Role</b> · tenant-side case handling</span>
              <span><b>Stage</b> · intake open</span>
            </div>
            <h1 className={s.h1}>
              Your landlord had 21 days.<br />
              <em>Time's up.</em>
            </h1>
            <p className={s.lede}>
              Tribune takes the case. Letters drafted, negotiation handled —{" "}
              <span className={s.hl}>
                most landlords settle once the statutory exposure is on the table.
              </span>{" "}
              You approve each move; we make them.
            </p>
            <div className={s.ctas}>
              <Link href={caseHref} className={`${s.btn} ${s.btnP}`}>
                Open a case — free evaluation →
              </Link>
              <a href="#playbook" className={`${s.btn} ${s.btnG}`}>
                See the playbook
              </a>
            </div>
            <div className={s.micro}>
              Free evaluation · 15% of recovery · No win, no fee · Not a law firm
            </div>
          </div>
        </div>
      </section>

      {/* § 01 Playbook */}
      <section id="playbook" className={s.sectionBone}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 01 · Playbook</div>
            <div>
              <h2 className={s.h2}>
                This isn't personal. <em>It's a numbers game.</em>
              </h2>
              <p className={s.dek}>
                Your landlord doesn't have a grudge — they don't think about you
                specifically at all. Across every tenancy, they're running the
                same calculation. For most tenants, it comes out in the landlord's
                favor. Deposit disputes are among the most common tenant complaints
                filed with state housing agencies, and the vast majority go
                unpursued.
              </p>
            </div>
          </div>
          <div className={s.playbook}>
            <div className={`${s.pbCol} ${s.pbColThem}`}>
              <h3 className={s.pbColHead}>
                <b>The landlord's model</b>
              </h3>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>01 · Deposits as income</div>
                <p className={s.pbItemText}>The landlord keeps it unless formally challenged. Most tenants never challenge it.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>02 · Turnover costs as "damage"</div>
                <p className={s.pbItemText}>Repainting, cleaning, re-keying — routine costs billed as tenant damage on the way out.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>03 · Same letter, every tenant</div>
                <p className={s.pbItemText}>Nothing personal. The same deductions go to every outgoing tenant — most of them stick.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>04 · Offer half, close the file</div>
                <p className={s.pbItemText}>If a tenant pushes back, a partial settlement is cheaper than a dispute. Most tenants take it.</p>
              </div>
            </div>
            <div className={s.pbCol}>
              <h3 className={s.pbColHead}>
                <b>What the landlord is counting on</b>
              </h3>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>01 · Tenants don't know the statute</div>
                <p className={s.pbItemText}>Most tenants know they paid a deposit. They don't know landlords have a legal deadline to return it — or what it costs to miss it.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>02 · Tenants let it go</div>
                <p className={s.pbItemText}>The overwhelming majority send one email and move on. The model is built around that rate.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>03 · Filing feels too hard</div>
                <p className={s.pbItemText}>Small claims sounds slow and complicated. A lot of valid claims drop here — even from tenants who know their rights.</p>
              </div>
              <div className={s.pbItem}>
                <div className={s.pbItemLabel}>04 · Half sounds good enough</div>
                <p className={s.pbItemText}>When the landlord offers a partial settlement, it feels like progress. For most tenants, it ends the dispute.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* § 02 Rights */}
      <section id="rights" className={s.section}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 02 · Your Rights</div>
            <div>
              <h2 className={s.h2}>
                What CT § 47a-21 actually says.{" "}
                <em>In plain English.</em>
              </h2>
              <p className={s.dek}>
                Connecticut's deposit statute is specific, enforceable, and most
                landlords are counting on you not having read it.
              </p>
            </div>
          </div>
          <div className={s.rights}>
            <div className={s.rRow}>
              <div className={s.rNum}>Right i.</div>
              <div>
                <h4 className={s.rHead}>21 days to return or itemize.</h4>
                <p className={s.rText}>After your tenancy ends, your landlord has exactly 21 days to return the full deposit with interest, or deliver a written, itemized list of damages. No list? The full amount is owed.</p>
              </div>
              <div className={s.rNote}><b>Deadline missed</b><br />Full return required</div>
            </div>
            <div className={s.rRow}>
              <div className={s.rNum}>Right ii.</div>
              <div>
                <h4 className={s.rHead}>Missed deadlines can mean more than the deposit.</h4>
                <p className={s.rText}>Under § 47a-21, when a landlord fails to comply — no statement, improper deductions, missed deadline — the court may award more than the deposit alone. We assess the full picture during intake and factor it into every letter.</p>
              </div>
              <div className={s.rNote}><b>Potential remedy</b><br />More than deposit alone</div>
            </div>
            <div className={s.rRow}>
              <div className={s.rNum}>Right iii.</div>
              <div>
                <h4 className={s.rHead}>Wear-and-tear is not deductible.</h4>
                <p className={s.rText}>Faded paint, worn carpet, minor scuffs — none are lawful deductions in Connecticut. Routine repaint, carpet shampoo, re-keying, and light cleaning are maintenance, not damage.</p>
              </div>
              <div className={s.rNote}><b>Tactic</b><br />Line-item dispute</div>
            </div>
            <div className={s.rRow}>
              <div className={s.rNum}>Right iv.</div>
              <div>
                <h4 className={s.rHead}>Interest is owed from day one.</h4>
                <p className={s.rText}>Your landlord is required to hold your deposit in a Connecticut escrow account and issue an annual interest statement by January 31. No statement? Separate violation.</p>
              </div>
              <div className={s.rNote}><b>Effect</b><br />Additional violation on record</div>
            </div>
            <div className={s.rRow}>
              <div className={s.rNum}>Right v.</div>
              <div>
                <h4 className={s.rHead}>You don't have to talk to them.</h4>
                <p className={s.rText}>Once Tribune is handling, every contact routes through us. You review and approve; we respond. No phone calls. No letter-drafting at 11pm. Written record preserved throughout.</p>
              </div>
              <div className={s.rNote}><b>Method</b><br />Written correspondence only</div>
            </div>
            <div className={s.rRow}>
              <div className={s.rNum}>Right vi.</div>
              <div>
                <h4 className={s.rHead}>Small claims is real leverage.</h4>
                <p className={s.rText}>Connecticut small claims handles deposit disputes — low filing fees, short timelines, no lawyer required. When a landlord believes filing is imminent, most negotiate in earnest. That credibility is the point.</p>
              </div>
              <div className={s.rNote}><b>Reality</b><br />Credible escalation changes math</div>
            </div>
          </div>
        </div>
      </section>

      {/* § 03 Exposure */}
      <section className={s.sectionBone}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 03 · Exposure</div>
            <div>
              <h2 className={s.h2}>
                Your claim may be worth more than the deposit alone.{" "}
                <em>The statute provides for it.</em>
              </h2>
              <p className={s.dek}>
                Depending on the violations, what you're owed can significantly
                exceed the original deposit. We run the numbers during intake —
                here's the shape of a typical case.
              </p>
            </div>
          </div>
          <div className={s.ledgerGrid}>
            <div className={s.ledgerCard}>
              <div className={s.ledgerTitle}>Illustrative case · your numbers vary</div>
              <div className={s.ledRows}>
                <span className={s.ledRowLabel}>Deposit withheld</span>
                <span className={s.ledRowVal}>$1,850.00</span>
                <span className={s.ledRowLabel}>Statutory damages (if applicable)</span>
                <span className={s.ledRowVal}>+ $1,850.00</span>
                <span className={s.ledRowLabel}>Interest accrued</span>
                <span className={s.ledRowVal}>+ $3.85</span>
                <span className={s.ledRowLabel}>Credit · landlord offer</span>
                <span className={s.ledRowVal}>($925.00)</span>
              </div>
              <div className={s.ledTotal}>
                <span className={s.ledTotalLabel}>Gap Tribune is negotiating →</span>
                <span className={s.ledTotalBig}>$2,778</span>
              </div>
            </div>
            <div className={s.ledgerCardBone}>
              <div className={s.ledgerTitle}>Why the math matters</div>
              <p style={{ margin: "0 0 12px", fontSize: "15.5px", lineHeight: "1.55" }}>
                A landlord who sees{" "}
                <span className={s.hl}>a documented claim, a statute citation, and a filing-ready package</span>{" "}
                negotiates very differently than one who gets{" "}
                <span className={s.hl}>a frustrated email</span>.
              </p>
              <p style={{ margin: 0, fontSize: "15.5px", lineHeight: "1.55", color: "var(--muted)" }}>
                <em>Most cases settle before filing. This is why.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* § 04 Process */}
      <section id="process" className={s.section}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 04 · Process</div>
            <div>
              <h2 className={s.h2}>
                How we handle your case.
              </h2>
              <p className={s.dek}>
                Once a case is open, Tribune takes over the back-and-forth:
                drafting, sending, following up, negotiating. If the landlord
                hasn't responded by the time we're through the sequence, we help
                you file in small claims.
              </p>
            </div>
          </div>
          <div className={s.exhibits}>
            <div className={s.ex}>
              <div className={s.exN}>Exhibit A · Week 1</div>
              <h4 className={s.exHead}>Open the case.</h4>
              <p className={s.exText}>Five minutes. Lease, photos, correspondence, deduction notice. Free evaluation — we'll tell you honestly if you have a case worth pursuing.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Exhibit B · Week 1</div>
              <h4 className={s.exHead}>We draft the demand.</h4>
              <p className={s.exText}>Grounded in § 47a-21, your facts, your numbers. Interest calculated, double-damages exposure quantified. You sign, we send certified.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Exhibit C · Weeks 2–4</div>
              <h4 className={s.exHead}>We negotiate.</h4>
              <p className={s.exText}>Responses, counters, follow-ups — Tribune handles all of it. Every update logged in your case file. Most matters resolve here.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Exhibit D · If required</div>
              <h4 className={s.exHead}>We prepare the filing.</h4>
              <p className={s.exText}>Complaint, indexed exhibits, statutory citations. Small claims in Connecticut is navigable without a lawyer — we make sure yours is filing-ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section className={s.sectionBone} style={{ padding: "80px 48px" }}>
        <div className={`${s.sectWrap} ${s.pullQuote}`}>
          <q>
            The calculation on the other side assumes the tenant won't act.{" "}
            <em><span className={s.hl}>We reset the calculation.</span></em>
          </q>
          <cite>— Tribune · On Method</cite>
        </div>
      </section>

      {/* § 05 Escalation */}
      <section id="escalate" className={s.section}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 05 · Escalation</div>
            <div>
              <h2 className={s.h2}>
                Why landlords take this seriously.
              </h2>
              <p className={s.dek}>
                Landlords who withhold deposits deal with many tenants. They've
                learned to read the room — who will follow through and who won't.
                Everything we do is designed to land clearly on the right side
                of that read. The vast majority return the deposit before it
                ever reaches filing.
              </p>
            </div>
          </div>
          <div className={s.exhibits}>
            <div className={s.ex}>
              <div className={s.exN}>Factor 01</div>
              <h4 className={s.exHead}>The correspondent signal.</h4>
              <p className={s.exText}>Correspondence from Tribune tells a landlord immediately that someone organized is handling this case — not a tenant writing alone at midnight. That perception shift happens before they've read the first sentence.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Factor 02</div>
              <h4 className={s.exHead}>The paper trail.</h4>
              <p className={s.exText}>Every communication is dated, cited, and on the record. A landlord ignoring a documented § 47a-21 deadline isn't just stalling — they're building a record against themselves. That changes their incentives.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Factor 03</div>
              <h4 className={s.exHead}>The credible commitment.</h4>
              <p className={s.exText}>We prepare your small-claims filing before we need it. "We are ready to file" and "we might file someday" land very differently — experienced landlords and property managers know exactly which one this is.</p>
            </div>
            <div className={s.ex}>
              <div className={s.exN}>Factor 04</div>
              <h4 className={s.exHead}>The asymmetric cost.</h4>
              <p className={s.exText}>Settling costs them the deposit. Holding out costs more, takes longer, and ends in court. Every ignored step makes the math clearer. Most landlords reach their own conclusion before we have to explain it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* § 06 FAQ */}
      <section id="faq" className={s.sectionBone}>
        <div className={s.sectWrap}>
          <div className={s.sectHead}>
            <div className={s.sectNum}>§ 06 · Q&A</div>
            <div>
              <h2 className={s.h2}>Common questions.</h2>
              <p className={s.dek}>
                If you don't see yours, open a case — the evaluation is free
                and you'll get a real answer, not a form reply.
              </p>
            </div>
          </div>
          <div>
            <details className={s.faqItem} open>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 01</span>
                <span className={s.faqQText}>Are you a law firm?</span>
              </summary>
              <div className={s.faqAnswer}>No. Tribune provides legal-information and document-preparation services and handles correspondence and negotiation on your behalf. Letters are signed by you; Tribune is named as preparer. We are not your attorney, do not provide legal advice or legal representation, and if a matter benefits from a lawyer we'll say so.</div>
            </details>
            <details className={s.faqItem}>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 02</span>
                <span className={s.faqQText}>What does it cost?</span>
              </summary>
              <div className={s.faqAnswer}>15% of what we recover, paid after the money reaches you. No recovery, no fee. Hard costs — certified mail, filing fees if it escalates — are pass-through and disclosed up front.</div>
            </details>
            <details className={s.faqItem}>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 03</span>
                <span className={s.faqQText}>Do I have to talk to my landlord?</span>
              </summary>
              <div className={s.faqAnswer}>No. Once your case is open, every contact routes to Tribune. You'll see every update and approve the major moves — but you never have to pick up a phone or write another word to your landlord.</div>
            </details>
            <details className={s.faqItem}>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 04</span>
                <span className={s.faqQText}>My landlord sent a deduction list. Still a case?</span>
              </summary>
              <div className={s.faqAnswer}>Usually. Deductions must be itemized, specific, documented, and exclude normal wear and tear — faded paint, worn carpet, routine cleaning. Most lists don't meet that bar. We evaluate yours line by line against § 47a-21.</div>
            </details>
            <details className={s.faqItem}>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 05</span>
                <span className={s.faqQText}>Am I eligible?</span>
              </summary>
              <div className={s.faqAnswer}>Tribune currently handles matters in Connecticut. If you're a residential tenant whose landlord withheld your deposit or failed to provide an itemized statement within 21 days of move-out, you likely have a case. Open one and we'll confirm in the first response.</div>
            </details>
            <details className={s.faqItem}>
              <summary className={s.faqSummary}>
                <span className={s.faqQNum}>Q 06</span>
                <span className={s.faqQText}>What if they ignore us?</span>
              </summary>
              <div className={s.faqAnswer}>Every ignored deadline strengthens the record. For true holdouts we prepare a small-claims package — complaint, exhibits, citations — ready to file. Small claims in Connecticut is tenant-navigable without a lawyer. Filing fees are typically under $75.</div>
            </details>
          </div>
        </div>
      </section>

      {/* § 07 Final CTA */}
      <section className={s.final}>
        <div className={s.finalInner}>
          <div className={s.finalSectNum}>§ 07 · Open a case</div>
          <h2 className={`${s.h2} ${s.finalH2}`}>
            Your landlord is counting on you doing nothing.
          </h2>
          <p className={`${s.dek} ${s.finalDek}`}>
            Five minutes to open the case. Free evaluation. If we take it, you
            don't write another word to your landlord.
          </p>
          <div className={s.ctasCentered}>
            <Link href={caseHref} className={`${s.btn} ${s.finalBtnP}`}>
              Open a case →
            </Link>
            <a href="#rights" className={`${s.btn} ${s.finalBtnG}`}>
              Read your rights
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.footerWrap}>
          <div>
            <strong>Tribune</strong>
            Case-handling for residential tenants in Connecticut. Rights,
            correspondence, negotiation, and escalation under § 47a-21 — so you
            don't do this alone.
          </div>
          <div>
            <strong>Service</strong>
            <Link href={caseHref}>Open a case</Link>
            <a href="#rights">Your rights</a>
            <a href="#process">How it works</a>
          </div>
          <div>
            <strong>Tribune</strong>
            <a href="#">About</a>
            <a href="#">Method</a>
            <a href="#">Contact</a>
          </div>
          <div>
            <strong>Notice</strong>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Not a law firm</a>
          </div>
          <div className={s.footerFine}>
            Tribune provides legal-information and document-preparation services and
            handles correspondence and negotiation on behalf of residential tenants.
            Tribune is not a law firm, is not your attorney, and does not provide
            legal advice or legal representation. All correspondence is signed by the
            tenant; Tribune is named as preparer and authorized correspondent.
            Connecticut residential tenants only. © 2026 Tribune Services, Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
