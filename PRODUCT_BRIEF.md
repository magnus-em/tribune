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
- **Tribune handles the correspondence.** Drafted demand letters are prepared by Tribune, signed by the tenant, and mailed by Tribune on the tenant's behalf. The tenant does not need to print, sign, or mail anything themselves.
- **Case management** so the tenant sees exactly where their case stands and what to do next.
- **Contingency pricing (15%)** — tenants owe nothing unless money is recovered.
- **Pro se model.** There is no attorney in the loop on either side. Tribune is a legal-information and document-preparation service.

## MVP Scope

The MVP is a **document-centric case workflow**. The loop is:

1. Tenant signs up, completes intake, and uploads supporting documents.
2. Admin (you) reviews the uploads in an internal panel.
3. Admin posts a tenant-visible update ("Tribune has reviewed your case and is preparing your initial demand letter") and, when ready, a drafted letter.
4. Tenant receives transactional email notifications on case updates.
5. From the tenant's perspective, the system behaves as though Tribune is operating autonomously — emails arrive, status changes, letters appear. Under the hood it is manual admin work.

This is the groundwork for eventually replacing the manual admin step with AI-generated drafts; the tenant-facing surface stays the same.

### In scope for MVP
- Tenant signup + magic link auth (existing).
- Structured intake form (existing — to be rebuilt on a server-side pipeline).
- Document upload (lease, landlord correspondence, deduction itemization, photos, other) stored in Supabase Storage.
- Tenant case detail with timeline, documents list, status, and "mark letter as sent" / "record landlord response" actions (most of this exists; needs updating).
- Admin case detail with uploads viewer, status controls, letter post, update post, internal/tenant-visible notes (most of this exists; needs the uploads panel).
- Transactional email on case events (new message, letter ready, landlord response recorded, deposit recovered, payment due).
- Pricing / contingency / costs agreement captured at intake and visible on the case.
- "Information, not legal advice" disclaimers on intake, dashboard, case detail, and email footers.
- Sentry for error monitoring, PostHog for product analytics — both with PII scrubbing.

### Out of scope for MVP
- Automated letter generation from templates.
- AI drafting of letters or responses.
- Automated letter delivery (print-and-mail API). Tribune mails manually in MVP.
- Court filing assistance. Mentioned in product copy as something Tribune will help with later; not built.
- Payment processing, invoicing, or a settlement trust account. Tenant pays Tribune directly after recovery.
- Collections integration. The *threat* of collections for non-payment is communicated; the mechanism is off-platform for now.
- Landlord-facing portal.
- Multi-tenant co-signers on a single account. MVP assumes one user account per case, even if the lease has multiple tenants. Co-tenant names are captured as data.
- SMS notifications.
- Document-content extraction (OCR / parsing lease terms or deduction amounts from uploaded files).
- Jurisdictions other than Connecticut.

## Direction Beyond MVP (not commitments)
- **AI-drafted letters** grounded in CT § 47a-21 templates and case data. Replaces manual admin drafting; admin review stays in place.
- **Document content extraction** (likely Claude vision against uploaded PDFs) to pre-fill structured deduction fields and accelerate admin review.
- **Automated letter delivery** via a print-and-mail API (Lob or similar) with certified mail tracking.
- **Court filing assistance** — structured small-claims filing package (CT JD-CV-40 equivalent) tenants can file pro se.
- **Deadline monitoring** with automated reminders as the statutory clock runs out.
- **Landlord-inbound email** via per-case addresses (AgentMail or equivalent) so landlord replies land in the case timeline automatically.

## Pricing, Costs, and Enforcement

- **Contingency:** 15% of amount recovered. No recovery, no fee.
- **Hard costs passed through at cost:** certified mailing, court filing fees if the case escalates. The tenant agrees to cover these at actual cost at intake.
- **Money flow:** settlements go directly from landlord to tenant. Tribune does not hold client funds.
- **Enforcement:** after recovery is confirmed, Tribune invoices the tenant for the 15%. Non-payment enters collections. Tribune independently confirms deposit recovery with the landlord; tenants cannot make the recovery disappear by not reporting it.

The collections language must be literally true — it's a real consequence, not a bluff. That's a follow-through commitment, not a product feature.

## Legal Posture (UPL)

- All correspondence is signed by the tenant. Tribune is named as the preparer of the document, not its author-in-authority.
- Tenant-facing copy presents **information**, not **advice** — what the statute says, what typical next steps look like, what the deadlines are. It does not tell a specific tenant what they should do in their specific situation.
- "Information, not legal advice" disclaimers appear on intake, dashboard, case detail, letter previews, and in every outbound email.
- Every outbound letter is reviewed by you (the admin) before posting. The admin UI is the review surface.

## Open Strategic Questions
- Minimum case size worth accepting (cost of admin time + mailing vs. 15% of the recovery). Defer until we have real cases.
- Exact UPL-safe wording for tenant-facing copy and letter templates. Needs attorney review before launch to real users.
- Whether to formalize the collections pathway (a specific agency contract) before making the threat in writing.
- Escalation path after letter 3: structured small-claims package vs. referral out.
