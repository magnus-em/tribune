/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import s from "./demo.module.css";

const STAGES = [
  { n: "01", name: "Intake", done: true },
  { n: "02", name: "Under Review", done: true },
  { n: "03", name: "Letter Sent", active: true },
  { n: "04", name: "Negotiation", done: false },
  { n: "05", name: "Resolved", done: false },
];

const ACTIVITY = [
  {
    date: "Apr 18",
    kind: "letter" as const,
    title: "Demand letter sent — Round 1",
    body: "Tribune sent a certified demand letter to Elm Street Properties LLC citing § 47a-21(d) violations. Letter documents three improper deductions totaling $1,650 and demands full return within 14 days.",
    actions: [{ label: "View letter", primary: false }, { label: "Download PDF", primary: false }],
  },
  {
    date: "Apr 14",
    kind: "update" as const,
    title: "Case reviewed — letter staged",
    body: "Tribune completed case review. Lease confirmed active through move-out date. Three deductions flagged as non-compliant: carpet cleaning ($400), painting ($750), and general cleaning ($500). Statutory deadline confirmed passed by 4 days.",
    actions: [],
  },
  {
    date: "Apr 10",
    kind: "update" as const,
    title: "Lease received and verified",
    body: "Lease agreement uploaded and verified. Move-out date confirmed as March 15, 2026. Statutory return deadline: April 5, 2026. Landlord failed to return or itemize within the 21-day window.",
    actions: [],
  },
  {
    date: "Apr 9",
    kind: "update" as const,
    title: "Case opened",
    body: "Tribune received your intake. Deposit: $2,400. Amount withheld: $1,650. Property: 312 Elm St, Apt 4B, New Haven, CT. Landlord: Elm Street Properties LLC.",
    actions: [],
  },
];

export default function CaseDemoPage() {
  return (
    <div className={s.shell}>
      {/* TOP NAV */}
      <nav className={s.topNav}>
        <div className={s.topNavInner}>
          <Link href="/" className={s.brand}>Tribune</Link>
          <Link href="/dashboard" className={s.navBack}>← All cases</Link>
          <span className={s.navUser}>Sarah K.</span>
        </div>
      </nav>

      <div className={s.page}>
        {/* MAIN COLUMN */}
        <div className={s.main}>

          {/* CASE HEADER */}
          <div className={s.caseHeader}>
            <div className={s.caseHeaderBrow}>
              <span>Case #TRB-2026-0041</span>
              <span className={`${s.statusBadge} ${s.statusBadgeActive}`}>Letter sent · Round 1</span>
            </div>
            <div className={s.caseHeaderBody}>
              <h1 className={s.caseTitle}>312 Elm St, Apt 4B</h1>
              <p className={s.caseVs}>vs. Elm Street Properties LLC · New Haven, CT</p>
              <div className={s.caseMetaRow}>
                <div className={s.caseMeta}>
                  <span className={s.caseMetaLabel}>Deposit paid</span>
                  <span className={s.caseMetaVal}>$2,400</span>
                </div>
                <div className={s.caseMeta}>
                  <span className={s.caseMetaLabel}>Amount withheld</span>
                  <span className={`${s.caseMetaVal} ${s.caseMetaValRed}`}>$1,650</span>
                </div>
                <div className={s.caseMeta}>
                  <span className={s.caseMetaLabel}>Opened</span>
                  <span className={s.caseMetaVal}>Apr 9, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE TRACK */}
          <div className={s.stageTrack}>
            <div className={s.stageTrackBrow}>
              <span>Case progression</span>
              <span>Step 3 of 5</span>
            </div>
            <div className={s.stages}>
              {STAGES.map((st) => (
                <div
                  key={st.n}
                  className={`${s.stage} ${st.done ? s.stageDone : ""} ${st.active ? s.stageActive : ""}`}
                >
                  <span className={s.stageN}>{st.n}</span>
                  <span className={s.stageName}>{st.name}</span>
                  <span className={s.stageDot} />
                </div>
              ))}
            </div>
          </div>

          {/* STATUS BANNER */}
          <div className={s.banner}>
            <span className={s.bannerIcon}>→</span>
            <div>
              <p className={s.bannerTitle}>Tribune is waiting on your landlord</p>
              <p className={s.bannerBody}>
                A certified demand letter was sent April 18. Your landlord has until May 2 to respond. Tribune monitors the deadline — you don't need to do anything. If they ignore it, that strengthens your statutory exposure.
              </p>
            </div>
          </div>

          {/* ACTIVITY LOG */}
          <div className={s.activityLog}>
            <div className={s.activityLogBrow}>
              <span>Case activity</span>
              <span>4 entries · newest first</span>
            </div>
            {ACTIVITY.map((entry, i) => {
              const tagClass = entry.kind === "letter" ? s.tagLetter : s.tagUpdate;
              return (
              <div key={i} className={s.activityEntry}>
                <div className={s.activityMeta}>
                  <span className={s.activityDate}>{entry.date}</span>
                  <span className={`${s.activityKindTag} ${tagClass}`}>
                    {entry.kind}
                  </span>
                </div>
                <div>
                  <p className={s.activityTitle}>{entry.title}</p>
                  <p className={s.activityBody}>{entry.body}</p>
                  {entry.actions.length > 0 && (
                    <div className={s.activityActions}>
                      {entry.actions.map((a, j) => (
                        <button key={j} className={`${s.btnTiny} ${a.primary ? s.btnTinyBlue : ""}`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          <p className={s.disclaimer}>
            Tribune is a document-preparation and legal-information service — not a law firm. All correspondence is signed by you; Tribune prepares and sends it on your behalf. This page provides status updates on your case only and is not legal advice.
          </p>
        </div>

        {/* SIDEBAR */}
        <div className={s.sidebar}>

          {/* CLAIM SUMMARY */}
          <div className={s.sideCard}>
            <div className={s.sideCardBrow}>
              <span>Claim summary</span>
            </div>
            <div className={s.sideCardBody}>
              <div className={s.claimFig}>$1,650</div>
              <p className={s.claimSub}>Amount in dispute</p>
              <div className={s.claimRows}>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Deposit paid</span>
                  <span className={s.claimRowVal}>$2,400</span>
                </div>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Returned</span>
                  <span className={s.claimRowVal}>$750</span>
                </div>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Withheld</span>
                  <span className={`${s.claimRowVal} ${s.claimRowValRed}`}>$1,650</span>
                </div>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Max 2× damages</span>
                  <span className={`${s.claimRowVal} ${s.claimRowValBlue}`}>$3,300</span>
                </div>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Tribune fee (15%)</span>
                  <span className={s.claimRowVal}>$247</span>
                </div>
                <div className={s.claimRow}>
                  <span className={s.claimRowLabel}>Your net (1×)</span>
                  <span className={`${s.claimRowVal} ${s.claimRowValBlue}`}>$1,402</span>
                </div>
              </div>
            </div>
          </div>

          {/* DEADLINE */}
          <div className={s.sideCard}>
            <div className={s.sideCardBrow}>
              <span>Statutory deadline</span>
            </div>
            <div className={s.sideCardBody}>
              <div className={s.deadlineVal}>Apr 5, 2026</div>
              <p className={s.deadlineSub}>§ 47a-21 · 21-day window</p>
              <p className={s.deadlineNote}>
                Landlord missed the statutory deadline by 4 days. Under § 47a-21, this strengthens your claim and may entitle you to double damages if the case goes to court.
              </p>
            </div>
          </div>

          {/* CASE READINESS */}
          <div className={s.sideCard}>
            <div className={s.sideCardBrow}>
              <span>Case readiness</span>
            </div>
            <div className={s.sideCardBody}>
              <div className={s.claimRows}>
                {[
                  { label: "Lease uploaded", done: true },
                  { label: "Move-out date confirmed", done: true },
                  { label: "Deduction notice received", done: true },
                  { label: "Forwarding address on file", done: false },
                ].map((item, i) => (
                  <div key={i} className={s.readinessItem}>
                    <span className={s.readinessLabel}>{item.label}</span>
                    {item.done
                      ? <span className={s.readinessDone}>✓ Done</span>
                      : <span className={s.readinessMissing}>Pending</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECOVERY CTA */}
          <div className={s.recoveryCta}>
            <span className={s.recoveryCtaLabel}>Got your money back?</span>
            <p className={s.recoveryCtaTitle}>Report a recovery</p>
            <p className={s.recoveryCtaBody}>
              If your landlord has returned funds directly to you, let us know so we can close the case and calculate your Tribune fee.
            </p>
            <button className={s.btnWhite}>Report recovery →</button>
          </div>

        </div>
      </div>
    </div>
  );
}
