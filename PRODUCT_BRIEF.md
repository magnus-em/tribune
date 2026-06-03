# Tribune — Product Brief

## Summary
Tribune is a tech-enabled service that helps Connecticut residential tenants recover security deposits that have been wrongfully withheld by their landlords. It guides tenants through a structured intake, collects the evidence needed to pursue the claim, and manages correspondence with the landlord — including drafted demand letters grounded in CT § 47a-21 — until the deposit is recovered or the matter is closed. The business operates on a contingency model: tenants pay nothing unless Tribune recovers money on their behalf.

## Target User
Residential tenants in Connecticut (initial focus: New Haven) who believe part or all of their security deposit has been wrongfully withheld. Wrongful withholding includes full non-return, partial return with unjustified deductions, or return made past the statutory deadline.

In practice, users will almost always be post-move-out, because only then does the statutory clock start and the claim become concrete. Tenants still in-lease may sign up if they anticipate a dispute, but the workflow assumes move-out has occurred.

**Out of target:** commercial tenants, non-CT tenants, non-residential disputes.

## Core Problem
CT § 47a-21 gives tenants strong rights — including potential double damages — when a landlord wrongfully withholds a deposit. In practice, most tenants do not pursue these rights because:
- The statutory process is intimidating and paperwork-heavy.
- Small-claims court is time-consuming relative to the amount at stake.
- Tenants don't know the legal standards or timelines.
- Lawyers are disproportionately expensive relative to deposit size.

The result is that tenants forfeit money they are legally entitled to, and landlords face little consequence for violations.

## Core Value Proposition
- **Structured intake** that captures the facts needed to evaluate and pursue a claim.
- **Evidence intake.** Tenants upload their lease, landlord correspondence, itemized-deduction letters, photos, and any other supporting documents directly into the case.
- **Tribune handles the correspondence directly.** Demand letters are drafted by Tribune and dispatched to the landlord by Tribune (email today; SMS and certified mail planned). The tenant does not draft, sign, or send anything themselves. Landlord replies come back into the case automatically via inbound email.
- **Case management** so the tenant sees exactly where their case stands and what to do next.
- **Contingency pricing (15%)** — tenants owe nothing unless money is recovered.
- **Pro se model.** There is no attorney in the loop on either side. Tribune is a legal-information and document-preparation service writing on the tenant's behalf.

## MVP Scope

The MVP is a **document-centric case workflow**. The loop is:

1. Tenant signs up, completes intake, and uploads supporting documents.
2. Admin (you) reviews the uploads in an internal panel.
3. Admin drafts a demand letter and dispatches it directly to the landlord via email (Resend). Reply-to is a per-case inbound address so landlord replies auto-route back into the case timeline.
4. Tenant receives transactional email notifications when Tribune sends a letter, when the landlord replies, and when the case resolves.
5. From the tenant's perspective, the system behaves as though Tribune is operating autonomously — Tribune handles the back-and-forth with the landlord and the tenant only acts to upload evidence and confirm recovery. Under the hood it is manual admin work.

This is the groundwork for eventually replacing the manual admin step with AI-generated drafts; the tenant-facing surface stays the same.

### In scope for MVP
- Tenant signup via email/password or Google OAuth.
- Structured intake form at `/dashboard/new-case` writing directly to `cases` via server action.
- Document upload (lease, landlord correspondence, deduction itemization, photos, other) stored in Supabase Storage.
- Tenant case detail with timeline, documents list, status, and "report recovery" action.
- Admin case detail with uploads viewer, status controls, letter draft + dispatch, update post, internal/tenant-visible notes, manual landlord-reply logging.
- Direct dispatch of demand letters to landlord via Resend, with per-case inbound reply address.
- Inbound webhook auto-logging landlord email replies into the case timeline (code shipped; DNS/MX pending).
- Transactional email on case events: letter dispatched, tenant-visible update posted, landlord reply received, deposit recovered (invoice).
- Invoice generation (`TRB-YYYY-NNNN`) on recovery, with Venmo/Zelle copy-paste payment instructions.
- Pricing / contingency / costs agreement captured at intake (15% contingency) and visible on the case.
- "Information, not legal advice" disclaimers on intake, dashboard, case detail, and email footers.
- Sentry for error monitoring, PostHog for product analytics — both with PII scrubbing.

### Out of scope for MVP
- AI drafting of letters or responses (templates exist in code; admin still writes manually).
- Print-and-mail delivery for landlords without email (Lob or similar). Email-only dispatch today.
- Court filing assistance. Mentioned in product copy as something Tribune will help with later; not built.
- Stripe-based invoice collection. Scaffolded on the `invoices` table but not wired; tenants pay via Venmo/Zelle today.
- Settlement trust account — money never flows through Tribune; landlord pays tenant directly.
- Collections integration. The *threat* of collections for non-payment is communicated; the mechanism is off-platform for now.
- Landlord-facing portal.
- Multi-tenant co-signers on a single account. MVP assumes one user account per case, even if the lease has multiple tenants. Co-tenant names are captured as data.
- SMS notifications.
- Document-content extraction (OCR / parsing lease terms or deduction amounts from uploaded files).
- Deadline-approaching alerts / cron.
- Jurisdictions other than Connecticut.

## Direction Beyond MVP (not commitments)
- **Admin "generate from template" UI.** Letter templates already exist in `src/lib/letters/templates.ts`; wire them into the admin write panel with case-data substitution.
- **AI-drafted letters** grounded in CT § 47a-21 templates and case data. Replaces manual admin drafting; admin review stays in place.
- **Document content extraction** (likely Claude vision against uploaded PDFs) to pre-fill structured deduction fields and accelerate admin review.
- **Stripe invoice collection** so tenants can pay the 15% contingency by card without manual Venmo/Zelle reconciliation. Scaffolded; not wired.
- **Print-and-mail delivery** via Lob or similar for landlords without email addresses, with certified-mail tracking.
- **Court filing assistance** — structured small-claims filing package (CT JD-CV-40 equivalent) tenants can file pro se.
- **Deadline monitoring cron** with automated reminders as the statutory clock runs out, plus admin badges for at-risk cases.

## Pricing, Costs, and Enforcement

- **Contingency:** 15% of amount recovered. No recovery, no fee.
- **Hard costs passed through at cost:** certified mailing, court filing fees if the case escalates. The tenant agrees to cover these at actual cost at intake.
- **Money flow:** settlements go directly from landlord to tenant. Tribune does not hold client funds.
- **Enforcement:** after recovery is confirmed, Tribune invoices the tenant for the 15%. Non-payment enters collections. Tribune independently confirms deposit recovery with the landlord; tenants cannot make the recovery disappear by not reporting it.

The collections language must be literally true — it's a real consequence, not a bluff. That's a follow-through commitment, not a product feature.

## Legal Posture (UPL)

- Tribune writes letters on the tenant's behalf as their authorized non-attorney representative, in the "our client, [Tenant Name]" voice. The tenant signs the service agreement at intake granting Tribune authority to communicate with the landlord on their behalf. Tribune does not present itself as a law firm and does not give advice on case strategy in a specific situation.
- Tenant-facing copy presents **information**, not **advice** — what the statute says, what typical next steps look like, what the deadlines are. It does not tell a specific tenant what they should do in their specific situation.
- "Information, not legal advice" disclaimers appear on intake, dashboard, case detail, letter previews, and in every outbound email.
- Every outbound letter is drafted and dispatched by the admin. The admin write panel is the review surface — there is no automated send.
- Letter template voice ("our client" framing) requires attorney review before any real-world dispatch.

## Strategic Thesis — What Makes Tribune Defensible

The right comparison is McKinsey or AlixPartners, not a legal form generator. That thesis holds only if Tribune becomes a real operating workflow — not a letter generator.

**Tribune is defensible when it is:**
- **Outcome-driven.** Every feature traces to deposit recovery. The system is evaluated by case outcomes, not activity.
- **Case-stateful.** The system knows where every case stands, why, and what the landlord is likely calculating. Status is not a label — it is operational context.
- **Evidence-aware.** Documents, photos, deduction notices, and landlord responses are structured data that inform strategy. Not file attachments that sit in storage.
- **Escalation-aware.** Tribune understands what makes a landlord settle — the documented, credible prospect of court — and builds pressure methodically. Each step is designed around how landlords actually behave.
- **Verifier-heavy.** Tribune independently confirms recovery. The tenant cannot make it disappear by not reporting it. Controls exist on both sides.
- **Memory-rich.** Prior landlord behavior, response patterns, case outcomes, and deduction types accumulate into reusable context across cases. Tribune gets smarter.
- **Trusted enough that users rely on it to run the process.** They don't manage Tribune — they report outcomes.

**Tribune is not defensible when it is:**
- Mainly a generator of letters or legal arguments — replicable with a prompt and a spreadsheet.
- Thin on controls and auditability — easily bypassed or gamed.
- Not accumulating workflow data across cases — no compounding advantage.
- A tool users have to manage, rather than a system they trust.

**The key strategic question is not "can Tribune use AI?" It is "can Tribune become the system that actually runs the recovery workflow?"** That is the difference between a cool feature and a defensible company. The moat is the workflow, the escalation logic, the data, and the trust — not the letter templates.

Every feature decision should be evaluated against this. If it makes Tribune more stateful, more verifier-heavy, more memory-rich, or more trustworthy as an operator — build it. If it makes Tribune a better document producer without adding operational depth — deprioritize or reframe it.

## Open Strategic Questions
- Minimum case size worth accepting (cost of admin time + mailing vs. 15% of the recovery). Defer until we have real cases.
- Exact UPL-safe wording for tenant-facing copy and letter templates. Needs attorney review before launch to real users.
- Whether to formalize the collections pathway (a specific agency contract) before making the threat in writing.
- Escalation path after letter 3: structured small-claims package vs. referral out.
