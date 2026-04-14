# Tribune — Specification

This document describes what the product does and the rules it operates under. Where the current implementation diverges from the intended behavior, that is noted.

## User Roles

- **Tenant** — the primary end user. Submits a case, uploads supporting documents, reviews case updates, confirms actions (letter sent, response received, resolution).
- **Admin** — Tribune staff (you). Reviews uploaded documents, drafts and posts demand letters, updates case status, posts tenant-visible updates, adds internal notes, confirms recovery, invoices the tenant for the contingency fee off-platform.

Admin access is granted via `profiles.is_admin = true`, set manually in the database. There is no self-serve admin signup.

## User Stories

### Tenant
- As a tenant, I can submit my case details through a guided intake form.
- As a tenant, I can sign in by email magic link.
- As a tenant, I can upload supporting documents to my case — lease, landlord correspondence, itemized deduction letter, photos, or other.
- As a tenant, I can see all my cases and their current status.
- As a tenant, I can open a case to see its full timeline and all uploaded documents.
- As a tenant, I can read demand letters that Tribune has drafted for my case.
- As a tenant, I receive transactional emails on case events (new update, letter ready, landlord response recorded, deposit recovered, payment due).
- As a tenant, I can record a response received from my landlord and upload any physical document the landlord sent.
- As a tenant, I can see pricing, fee terms, and disclaimers ("information, not legal advice") prominently on intake, dashboard, and case detail.
- *[deferred post-MVP]* As a tenant, I can copy a letter's text to my clipboard and mail it myself (not needed — Tribune mails all letters).
- *[deferred post-MVP]* As a tenant, I see deadline-approaching warnings on my dashboard.

### Admin
- As an admin, I can see all cases filtered by status with key metrics (deposit amount, deadline, days overdue).
- As an admin, I can open a case and see full tenant, property, landlord, lease, and deposit details.
- As an admin, I can view, download, and preview every document the tenant has uploaded, grouped by kind.
- As an admin, I can change a case's status.
- As an admin, I can post a demand letter (title + body + letter number 1–3) to a case. Posting a letter produces a timeline entry visible to the tenant and triggers a notification email.
- As an admin, I can post a visible update to the tenant (freeform message, no letter number).
- As an admin, I can add an internal note (hidden from tenant) or a tenant-visible note.
- As an admin, I can record that a letter has been mailed (Tribune-side) so the case shows "letter sent" to the tenant.
- As an admin, I can record recovery: amount recovered, fee calculated, any tenant-reimbursed costs, and mark the case resolved.
- *[deferred post-MVP]* As an admin, I can generate a letter from a CT § 47a-21 template pre-filled with case data.
- *[deferred post-MVP]* As an admin, I can run AI extraction against uploaded documents.

## Main Flows

### Intake → Auth → Case Creation (target — not current)

1. Visitor lands on `/intake`, completes a multi-step form (tenant info → property → landlord → deposit + contingency agreement).
2. On submit, a server action:
   - Validates the payload with Zod.
   - Calls `supabase.auth.signInWithOtp({ email })`.
   - Writes the intake payload to a `pending_cases` table keyed by email.
   - Redirects the user to `/auth/confirm`.
3. The user clicks the magic link → `/auth/callback`.
4. The callback exchanges the code for a session. A server action then:
   - Finds the `pending_cases` row by the authenticated user's email.
   - Inserts a `cases` row.
   - Deletes the `pending_cases` row.
   - Redirects to the dashboard.

This eliminates the current `sessionStorage` bridge and the cross-device failure mode.

**Current state:** the `sessionStorage` bridge is still in place. The server-side pipeline is the first planned migration before any new feature work.

### Document Upload (new)

1. Tenant opens their case detail.
2. Tenant picks a document kind (lease / landlord_correspondence / deduction_itemization / photo / other) and selects files.
3. A server action validates and obtains a signed Supabase Storage upload URL scoped to `case_documents/<case_id>/<uuid>`.
4. On upload success, the server action inserts a `case_documents` row and appends a `system` timeline entry ("Tenant uploaded {kind}: {filename}").
5. The admin case page shows the uploaded document in its kind section with preview/download links.

### Tenant Dashboard

1. User visits `/dashboard`; middleware checks session.
2. User sees their list of cases with status, deposit amount, and deadline.
3. User opens a case → `/dashboard/case/[id]`.
4. User sees: status summary, timeline (non-admin-only messages), documents grouped by kind, upload controls, "record landlord response" and "mark resolved" actions, pricing disclosure, disclaimer banner.

### Admin Case Management

1. Admin visits `/admin`; middleware checks session AND `is_admin = true`.
2. Admin filters cases by status, opens a case → `/admin/case/[id]`.
3. Admin sees: tenant/property/landlord/lease/deposit details, documents viewer, full timeline (including admin-only notes), status dropdown, letter post form, update post form, note form (internal or visible), actions timeline, resolution controls.
4. Status changes and letter posts append `case_messages` entries of appropriate type. Letter posts increment `current_letter_number` (the only code path allowed to touch it).
5. Letter posts and tenant-visible updates send a transactional email to the tenant via Resend.

### Resolution

1. Admin confirms recovery with the landlord off-platform.
2. Admin opens the case, fills resolution fields (amount recovered in cents, tenant-reimbursed hard costs in cents, resolution notes), sets status to `resolved`.
3. System records `amount_recovered_cents`, `fee_collected_cents` (15% of recovered by default, editable), `tenant_costs_cents`, `resolved_at`.
4. Tenant receives "Deposit recovered, invoice attached" email. Invoice is sent off-platform by admin for MVP.
5. If tenant does not pay within the agreed window, admin moves status to `in_collections`.

## Functional Requirements

- Authentication is email magic link only.
- Data access from the application:
  - **Reads** go through the anon Supabase client from client components. RLS enforces who can read what.
  - **Writes** that require server-side integrity (intake, uploads, letter post, resolution, case_documents creation) go through server actions operating under the user's session.
- All money is stored and computed in integer cents.
- All dates are stored in Postgres `date` columns and exchanged as ISO date strings.
- The statutory deadline is `move_out_date + 30 days`, stored on the case at creation time.
- The contingency rate default is 15% and is recorded on the case at creation time. Historical cases retain the rate they were created with.
- Letter numbers are 1, 2, or 3. `current_letter_number` is updated only when a letter is posted.
- Admin actions that change state also produce a visible timeline entry.
- Internal notes (`is_admin_only = true`) are invisible to tenants via RLS.
- Transactional email is sent via Resend on: new tenant-visible message posted, letter posted, status transition to `letter_sent`, status transition to `resolved`, status transition to `in_collections`.

## Non-Functional Requirements

- **Legal accuracy.** The product drafts legal correspondence. Citations, deadlines, and damages calculations must be correct. Any change to legal content or legal math requires explicit human review.
- **PII handling.** The database stores tenant and landlord PII. No PII may be logged, sent to Sentry, or sent to PostHog. The analytics wrapper is the chokepoint.
- **Authorization boundary.** RLS is authoritative. Middleware is convenience only. Server actions run under the user's session.
- **Jurisdiction scope.** Connecticut only, residential only.
- **Audit trail.** The `case_messages` timeline is the de facto audit log. Every state change produces an entry.
- **UPL disclaimers.** Every tenant-facing page and outbound email carries an "information, not legal advice" disclaimer.

## Edge Cases

- Tenant's statutory deadline has already passed at intake time — accept; note in the timeline; case is still worth pursuing (statute-of-limitations distinct from the 30-day return deadline).
- Partial deposit return (non-zero `deposit_returned_cents` and non-zero `amount_withheld_cents`).
- No landlord email on file — letter delivery is by mail; email is nice-to-have.
- Tenant opens magic link on a different device — handled by server-side `pending_cases` keyed to email, not session.
- Tenant submits a case for a property/landlord they've already submitted — accepted; no dedup yet.
- Landlord provides itemized deductions vs. not — different legal standard (strict vs. double damages). Reflected in letter content; not yet branched in admin flow.
- Admin changes status backward (e.g. `resolved` → `under_review`). Allowed; timeline shows the transition.
- Multiple tenants on one lease — MVP captures co-tenant names but one user account represents the case.
- Recovery is partial — recorded as `amount_recovered_cents` less than `amount_withheld_cents`. Case may still be marked `resolved`, or left `awaiting_landlord` if Tribune is pursuing the balance.
- Tenant fails to pay the contingency after recovery — status moves to `in_collections`.
- Tenant abandons the case / stops responding — status moves to `dead`.

## Assumptions

- Users complete intake and open their magic link within the OTP expiry window (cross-device is tolerated via `pending_cases`).
- One `cases` row per tenant per dispute. Tenants may have multiple cases over time.
- A single admin (you) handles all cases manually at MVP scale. No concurrent-edit protection.
- Letter sequence escalates: letter 1 (initial demand) → letter 2 (follow-up) → letter 3 (final notice before escalation). Exact content is drafted by admin.
- Contingency is calculated on the amount *recovered*, not the amount *withheld*.
- Statutory deadline of `move_out + 30 days` reflects the CT framework. *[uncertain — exact subsection and damages language for letter templates to be hand-authored with review]*.

## Open Questions

- How does Tribune handle cases where the statute of limitations has passed?
- Are there case-acceptance criteria (minimum amount, lease type)? Today the intake accepts any submission.
- What is the escalation path after letter 3? Small-claims filing package vs. referral out.
- If the tenant stops responding, how long before the case moves to `dead`? What notice is given?
- If the landlord pays partially, is the case considered resolved? Does Tribune pursue the remainder?
- What collections agency will Tribune partner with to make the collections threat real?
- UPL stance — exact language review for letters and tenant-facing copy, needed before real users.
