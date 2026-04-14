# Tribune — Product Brief

## Summary
Tribune is a tech-enabled service that helps Connecticut tenants recover security deposits that have been wrongfully withheld by their landlords. It guides tenants through a structured intake, produces legally grounded demand letters (under CT § 47a-21), and manages the correspondence and case timeline until the deposit is recovered or the matter is closed. The business operates on a contingency model: tenants pay nothing unless Tribune recovers money on their behalf.

## Target User
Connecticut tenants who have moved out of a rental unit and believe part or all of their security deposit has been wrongfully withheld. The wrongful withholding may be a full non-return, a partial return with unjustified deductions, or a return made past the statutory deadline.

*[uncertain] Whether there are other served segments (e.g. commercial tenants, tenants still in-lease, out-of-state tenants). Current intake UX assumes residential post-move-out tenants in CT.*

## Core Problem
CT § 47a-21 gives tenants strong rights — including potential double damages — when a landlord wrongfully withholds a deposit. In practice, most tenants do not pursue these rights because:
- The statutory process is intimidating and paperwork-heavy.
- Small-claims court is time-consuming relative to the amount at stake.
- Tenants don't know the legal standards or timelines.
- Lawyers are disproportionately expensive relative to deposit size.

The result is that tenants forfeit money they are legally entitled to, and landlords face little consequence for violations.

## Core Value Proposition
- **Structured intake** that captures the facts needed to evaluate and pursue a claim.
- **Drafted demand letters** citing CT § 47a-21, with correct deadline math and damages calculations.
- **Case management** so the tenant sees exactly where their case stands and what to do next.
- **Contingency pricing (25%)** — tenants owe nothing unless money is recovered.
- **No attorney required on the tenant's side** — Tribune assists with pro se action. There is no attorney in the loop on Tribune's side either.

## In Scope for MVP
- Tenant intake (multi-step form, Zod validation).
- Auth via Supabase magic link OTP.
- Tenant dashboard showing case status and correspondence thread.
- Admin dashboard for case triage, status updates, and manual letter posting.
- Database schema with RLS enforcing tenant/admin separation.
- Manual letter composition by admin (pasted into the admin UI).

## Out of Scope for MVP
- Automated letter generation from templates.
- Automated letter delivery (mailing, email to landlord).
- Attorney review workflow.
- Email/SMS notifications to tenants.
- Deadline monitoring and alerts.
- Document uploads (lease, landlord responses, evidence).
- PDF generation / printable letter output.
- Payment processing / settlement tracking / invoicing.
- Analytics and reporting dashboards.
- Jurisdictions other than Connecticut.

## Direction Beyond MVP (not commitments)
- **Letter generation** from CT-specific templates is the highest-value next feature.
- **Automated letter delivery** (likely direct mail via a print-and-mail API) is planned — tenants will not need to mail letters themselves long-term.
- **Email notifications** and **deadline tracking** are planned.

## Open Strategic Questions
- *[uncertain]* Unauthorized practice of law (UPL) stance — Tribune operates without an attorney in the loop. The product must stay on the correct side of "legal information + document preparation service" vs. "practicing law." This affects letter wording, tenant-facing advice, and marketing claims.
- *[uncertain]* Whether Tribune will long-term act as the signer/sender of letters, or whether letters will always be sent by/on behalf of the tenant (pro se).
- *[uncertain]* Minimum case size, maximum case size, or case-acceptance criteria.
