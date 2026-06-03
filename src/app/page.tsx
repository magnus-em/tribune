/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import s from "./landing.module.css";

function DepositCalculator() {
  const [amount, setAmount] = useState(1850);

  const fmt = (n: number) =>
    n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;

  const lawyerFees = 1200;
  const tribuneNet1x = amount - Math.round(amount * 0.15);
  const tribuneNet2x = amount * 2 - Math.round(amount * 2 * 0.15);
  const lawyerNet1x = amount - lawyerFees;
  const lawyerNet2x = amount * 2 - lawyerFees;

  return (
    <div className={s.calcCard}>
      <div className={s.calcBrow}>
        <span>Case calculator</span>
        <span className={s.calcBadge}>Estimate</span>
      </div>
      <div className={s.calcSubtitle}>What you'd walk away with: Tribune vs. hiring a lawyer</div>
      <div className={s.calcBody}>
        <p className={s.calcSliderLabel}>Amount in dispute</p>
        <div className={s.calcAmount}>{fmt(amount)}</div>
        <input
          type="range"
          min={300}
          max={5000}
          step={50}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className={s.calcSlider}
        />
        <div className={s.calcSliderRange}>
          <span>$300</span>
          <span>$5,000</span>
        </div>

        <div className={s.calcDivider} />

        <div className={s.calcCompare}>
          <div className={s.calcCompareLabelEmpty} />
          <div className={s.calcCompareColHead}>Tribune</div>
          <div className={s.calcCompareColHead}>Attorney</div>

          <div className={s.calcRowLabel}>They fold (no court)</div>
          <div className={s.calcColGood}>{fmt(tribuneNet1x)}</div>
          <div className={`${s.calcColBad} ${lawyerNet1x < 0 ? s.calcColNeg : ""}`}>
            {fmt(lawyerNet1x)}
          </div>

          <div className={s.calcRowLabel2x}>We file · up to 2× damages</div>
          <div className={s.calcColGood2x}>{fmt(tribuneNet2x)}</div>
          <div className={s.calcColBad2x}>{fmt(lawyerNet2x)}</div>
        </div>

        <p className={s.calcNote}>
          Tribune: 15% of recovery, $0 if nothing recovered. Attorney fees estimated ~$1,200 (avg. 4 hrs × $300/hr).
        </p>
      </div>
    </div>
  );
}

function useCaseHref() {
  const [href, setHref] = useState("/login?next=/dashboard/new-case");
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) setHref("/dashboard/new-case");
      });
  }, []);
  return href;
}

const CHARGES = [
  { item: "Painting / paint touch-ups", amount: "$200–$500", reason: "Normal paint fading is the landlord's cost." },
  { item: "Carpet cleaning", amount: "$150–$400", reason: "Routine soiling from normal use is wear and tear." },
  { item: "General cleaning", amount: "$100–$350", reason: "Cleaning between tenants is a cost of being a landlord." },
  { item: "Scuffs / marks on walls", amount: "$50–$200", reason: "Furniture touches walls. That's everyday living." },
  { item: "Nail holes", amount: "$50–$150", reason: "Hanging pictures is normal wear and tear." },
];

const LAW_FACTS = [
  { sym: "§ 1", title: "21-day deadline", body: "21 days to return the deposit or send an itemized list. Miss it by a day and your claim gets significantly stronger." },
  { sym: "§ 2", title: "Specific itemization required", body: "\"Cleaning — $300\" isn't compliant. Connecticut requires specific, documented deductions. Most landlords don't meet this bar." },
  { sym: "§ 3", title: "Interest & escrow", body: "Deposits must be held in interest-bearing accounts with annual statements. If they weren't, that's a separate violation." },
  { sym: "§ 4", title: "Double damages", body: "Courts can award double the amount wrongfully withheld. That's in the statute — Tribune prepares the documentation; you assert the claim.", highlight: true },
  { sym: "§ 5", title: "Burden is on them", body: "Your landlord has to justify every dollar kept. Can't document it? Can't deduct it." },
];

export default function LandingPage() {
  const caseHref = useCaseHref();

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.revealed);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={s.page}>
      {/* NAV */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <span className={s.navLogo}>Tribune</span>
          <div className={s.navLinks}>
            <a href="#charges">What they can't charge</a>
            <a href="#law">Your rights</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link href={caseHref} className={s.navCta}>
            Start free review →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroLeft} data-reveal>
            <div className={s.heroEyebrow}>
              <span className={s.yalePill}>Built by Yale students</span>
              <span className={s.pill}>Connecticut · § 47a-21</span>
              <span className={s.pill}>No fee unless we recover</span>
            </div>
            <h1 className={s.heroH1}>
              Your landlord kept<br />
              your deposit —<br />
              <em>or part of it.</em><br />
              We'll get it back.
            </h1>
            <p className={s.heroSub}>
              Not a form letter you could send yourself — a system that adapts to your landlord and makes paying you back their cheapest move. You stay out of it.
            </p>
            <div className={s.heroCtas}>
              <Link href={caseHref} className={s.btnPrimary}>
                Start your free case review →
              </Link>
              <a href="#charges" className={s.btnOutline}>
                See what they can't charge
              </a>
            </div>
          </div>

          <div className={s.heroRight} data-reveal>
            <DepositCalculator />
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <div className={s.proofStrip}>
        <span>15% contingency</span>
        <span className={s.dot}>·</span>
        <span>No upfront cost</span>
        <span className={s.dot}>·</span>
        <span>CT § 47a-21 specialists</span>
      </div>

      {/* THE STRATEGY */}
      <section className={s.strategySection}>
        <div className={s.wrap}>
          <p className={s.label} data-reveal>01 / Why Landlords Fold</p>
          <div className={s.strategyLead} data-reveal>
            <div className={s.strategyLeadStat}>
              They do this<br />all the time.<br /><em>You've done it once.</em>
            </div>
            <p className={s.strategyLeadBody}>
              That asymmetry is a landlord's whole advantage. They're betting you don't know the rules and won't follow through — because most tenants don't. Tribune erases the bet. Now they're the one negotiating against someone who has seen the entire playbook.
            </p>
          </div>
          <div className={s.strategyGrid}>
            <div className={s.strategyCard} data-reveal>
              <div className={s.strategyCardN}>01</div>
              <h3 className={s.strategyCardTitle}>We know the script</h3>
              <p className={s.strategyCardBody}>
                Stall, vague invoice, lowball, silence. Landlords run a small set of plays — and we know what each one is actually worth under § 47a-21.
              </p>
            </div>
            <div className={s.strategyCard} data-reveal>
              <div className={s.strategyCardN}>02</div>
              <h3 className={s.strategyCardTitle}>Every move is calibrated</h3>
              <p className={s.strategyCardBody}>
                This isn't a template you could've downloaded. We read your landlord's specific response and adapt the next step to the leverage your case actually has.
              </p>
            </div>
            <div className={s.strategyCard} data-reveal>
              <div className={s.strategyCardN}>03</div>
              <h3 className={s.strategyCardTitle}>Folding becomes the smart move</h3>
              <p className={s.strategyCardBody}>
                Against documented exposure and someone who won't go away, paying you back is cheaper than fighting. We make that math impossible to miss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THAT'S NOT DAMAGE — THE INVOICE */}
      <section className={s.sectionInvoice} id="charges">
        <div className={s.wrap}>
          <p className={s.label} data-reveal>02 / What They Can't Charge</p>
          <h2 className={s.h2} data-reveal>
            Most deduction lists<br />don't hold up.
          </h2>
          <p className={s.dek} data-reveal>
            Under Connecticut law, normal wear and tear is never deductible. Landlords charge for it anyway — because most tenants don't push back.
          </p>

          <div className={s.invoice} data-reveal>
            <div className={s.invoiceHead}>
              <div>
                <div className={s.invoiceFrom}>123 Property Holdings LLC · New Haven, CT</div>
                <div className={s.invoiceDate}>April 2026</div>
              </div>
              <div className={s.invoiceTitleBlock}>
                <div className={s.invoiceTitle}>SECURITY DEPOSIT</div>
                <div className={s.invoiceTitle}>DEDUCTION NOTICE</div>
              </div>
            </div>
            <div className={s.invoiceCols}>
              <span>Item charged</span>
              <span className={s.invoiceColAmt}>Amount</span>
              <span>Verdict</span>
            </div>
            {CHARGES.map((c, i) => (
              <div
                key={i}
                className={s.invoiceRow}
                style={{ "--delay": `${i * 0.09}s` } as React.CSSProperties}
              >
                <span className={s.invoiceItem}>{c.item}</span>
                <span className={s.invoiceAmt}>{c.amount}</span>
                <div className={s.invoiceVerdict}>
                  <span className={s.stamp}>Not deductible</span>
                  <span className={s.stampReason}>{c.reason}</span>
                </div>
              </div>
            ))}
            <div className={s.invoiceFoot}>
              <p className={s.invoiceFootNote}>
                These charges appear in thousands of CT deduction notices. Most don't hold up under § 47a-21.
              </p>
              <div className={s.invoiceFootTotal}>
                <span className={s.invoiceFootLabel}>Total claimed</span>
                <span className={s.invoiceFootAmt}><s>$2,850+</s></span>
                <span className={s.invoiceFootVerdict}>Potentially void under § 47a-21</span>
              </div>
            </div>
          </div>

          <blockquote className={s.ruleBox} data-reveal>
            <span className={s.ruleBoxLabel}>The rule</span>
            <p>If it happened because someone <em>lived</em> there — not because they <em>abused</em> it — it's wear and tear. Landlords don't get to charge you for the passage of time.</p>
          </blockquote>
        </div>
      </section>

      {/* LAW BACKS YOU UP */}
      <section className={s.sectionCream} id="law">
        <div className={s.wrap}>
          <p className={s.label} data-reveal>03 / The Law</p>
          <h2 className={s.h2} data-reveal>
            Connecticut law is specific.<br /><em>And it's on your side.</em>
          </h2>
          <div className={s.lawGrid}>
            {LAW_FACTS.map((f, i) => (
              <div
                key={i}
                className={`${s.lawCard} ${f.highlight ? s.lawCardHL : ""}`}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className={s.lawSym}>{f.sym}</div>
                <h3 className={s.lawTitle}>{f.title}</h3>
                <p className={s.lawBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={s.sectionNarrative} id="how">
        <div className={s.narrativeWrap}>
          <p className={s.label} data-reveal>04 / How It Works</p>
          <h2 className={s.h2} data-reveal>Built on how<br /><em>landlords actually behave.</em></h2>
          <div className={s.narrativeLayout}>
            <div className={s.narrativeLeft} data-reveal>
              <p style={{ fontSize: "17px", lineHeight: "1.75", color: "var(--ink-mid)", margin: "0 0 24px" }}>
                The delay, the vague invoice, the lowball offer — each step of our process is built around what landlords actually do.
              </p>
              <p style={{ fontSize: "17px", lineHeight: "1.75", color: "var(--ink-light)", margin: "0" }}>
                You see every update in your case log. You don't have to deal with any of it.
              </p>
            </div>
            <div className={s.narrativeRight}>
              {[
                {
                  n: "01",
                  title: "Case review",
                  body: "We evaluate your documents, timeline, and the landlord's compliance with § 47a-21. If the claim isn't strong, we'll tell you directly.",
                },
                {
                  n: "02",
                  title: "The opening demand",
                  body: "A formal demand citing § 47a-21, documenting every violation, and naming the deadline — with their exposure calculated to the dollar. Some landlords settle on this alone.",
                },
                {
                  n: "03",
                  title: "We read the response and adapt",
                  body: "Holdouts test you with vague rebuttals, lowball offers, and silence. We know what each one means and answer it specifically — every round adding to the record and to what they stand to lose.",
                },
                {
                  n: "04",
                  title: "Small claims if needed",
                  body: "Most cases resolve before this point. For holdouts, we prepare the complete filing package. You show up once. Filing fees are typically under $75.",
                },
              ].map((stage, i) => (
                <div key={i} className={s.narrativeStage} data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <div className={s.narrativeStageNum}>{stage.n}</div>
                  <div>
                    <h3 className={s.narrativeStageTitle}>{stage.title}</h3>
                    <p className={s.narrativeStageBody}>{stage.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={s.stepsCta} data-reveal style={{ marginTop: "60px" }}>
            <Link href={caseHref} className={s.btnDark}>
              Start your free case review →
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={s.sectionPricing} id="pricing">
        <div className={s.wrap}>
          <div className={s.pricingWrap} data-reveal>
            <p className={s.label}>05 / Pricing</p>
            <div className={s.pricingFig}>15%</div>
            <h2 className={s.pricingHead}>No recovery, no fee.</h2>
            <p className={s.pricingBody}>
              Tribune charges 15% of what we recover — paid after the money hits your account. If we recover nothing, you owe nothing.
            </p>
            <div className={s.pricingVs}>
              <div className={s.pricingVsCol}>
                <span className={s.pricingVsLabel}>Attorney</span>
                <span className={s.pricingVsVal}><s>$250–400/hr</s></span>
                <span className={s.pricingVsNote}>3–6 hrs typical · $800–2,400+ before recovery</span>
              </div>
              <span className={s.pricingVsDivider}>vs</span>
              <div className={s.pricingVsCol}>
                <span className={s.pricingVsLabel}>Tribune</span>
                <span className={s.pricingVsValGood}>15% of recovery</span>
                <span className={s.pricingVsNote}>$0 if we recover nothing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className={s.sectionCream}>
        <div className={s.wrap}>
          <p className={s.label} data-reveal>06 / About</p>
          <div className={s.aboutWrap} data-reveal>
            <h2 className={s.aboutH2}>Built at Yale.</h2>
            <p className={s.aboutBody}>
              We've been through this — bogus deductions, holdout landlords, the whole thing. After researching the statute and learning how bad landlords actually operate, we built Tribune to make what we figured out available to every Connecticut tenant.
            </p>
            <p className={s.aboutFine}>
              Tribune is a legal-information and document-preparation service — not a law firm, and nothing here is legal advice. We handle the research, drafting, and correspondence; you authorize what goes out. If a case would be better with an attorney, we'll tell you directly.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.sectionFaq} id="faq">
        <div className={s.wrap}>
          <p className={s.label} data-reveal>07 / FAQ</p>
          <h2 className={s.h2} data-reveal>Common questions.</h2>
          <div className={s.faqCols}>
            {[
              { q: "Are you a law firm?", a: "No. Tribune is a document-preparation and legal-information service. You authorize what goes out — we research, draft, and handle the correspondence. If your case needs a lawyer, we'll tell you." },
              { q: "Why not just send a letter myself?", a: "You can — and if your landlord is reasonable, it might work. Most aren't. They stall because they're betting you'll give up, and a one-off letter from a tenant who won't follow through is a bet they're happy to take. Tribune doesn't give up, knows every move they'll try, and adapts each response to your specific case. You stop being one tenant guessing at the rules." },
              { q: "What does it cost?", a: "15% of what we recover, paid after money hits your account. If we recover nothing, you pay nothing. Hard costs are pass-through and disclosed up front." },
              { q: "Do I have to deal with my landlord?", a: "No. Tribune handles all correspondence. The entire negotiation runs through us — you see updates but you're completely out of the conversation." },
              { q: "My landlord sent a deduction list. Still a case?", a: "Often yes. Deductions must be itemized, specific, documented, and exclude normal wear and tear. Most don't meet that standard." },
              { q: "What if my landlord ignores the letters?", a: "Every ignored deadline raises the statutory exposure and strengthens the record. For holdouts, we prepare the small-claims package ready to file." },
              { q: "How long does this take?", a: "Most matters resolve in 4–8 weeks. Small claims adds time but is straightforward — filing fees are typically under $75." },
            ].map((f, i) => (
              <details key={i} className={s.faqItem} data-reveal>
                <summary className={s.faqQ}>{f.q}</summary>
                <p className={s.faqA}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={s.sectionFinal}>
        <div className={s.wrap}>
          <div className={s.finalInner} data-reveal>
            <h2 className={s.finalH2}>
              Your landlord is counting on you<br />
              to do nothing.<br />
              <em>Prove them wrong.</em>
            </h2>
            <div className={s.finalRight}>
              <Link href={caseHref} className={s.btnPrimary}>
                Start your free case review →
              </Link>
              <p className={s.finalMicro}>
                Takes about 10 minutes · No credit card · No commitment unless we recover
              </p>
              <p className={s.finalFine}>
                Tribune provides legal-information and document-preparation services for Connecticut tenants. Not a law firm. All correspondence signed by the tenant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <strong>Tribune</strong>
            <p>Security deposit recovery for Connecticut tenants.</p>
          </div>
          <div className={s.footerLinks}>
            <Link href={caseHref}>Open a case</Link>
            <a href="#charges">What they can't charge</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <p className={s.footerFine}>© 2026 Tribune Services, Inc. · Not a law firm · Connecticut only</p>
        </div>
      </footer>
    </div>
  );
}
