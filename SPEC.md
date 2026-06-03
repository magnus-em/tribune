# Tribune — Specification

This document describes what the product does and the rules it operates under. Where the current implementation diverges from the intended behavior, that is noted.

## User Roles

- **Tenant** — the primary end user. Submits a case, uploads supporting documents, and monitors status. Tribune handles all landlord correspondence on the tenant's behalf; the tenant's active role is intake and reporting recovery when it arrives.
- **Admin** — Tribune staff (you). Reviews uploaded documents, drafts and dispatches demand letters directly to the landlord, logs landlord replies, updates case status, posts tenant-visible updates, adds internal notes, records recovery, and invoices the tenant for the contingency fee off-platform.

Admin access is granted via `profiles.is_admin = true`, set manually in the database. There is no self-serve admin signup.

## User Stories

### Tenant
- As a tenant, I can submit my case details through a guided intake form.
- As a tenant, I can upload supporting documents to my case — lease, landlord correspondence, itemized deduction letter, photos, or other.
- As a tenant, I can see all my cases and their current status.
- As a tenant, I can open a case to see its correspondence timeline: what Tribune sent, when, and what the landlord replied.
- As a tenant, I receive transactional emails on case events (letter dispatched on my behalf, landlord replied, deposit recovered, payment due).
- As a tenant, I can report that my landlord returned my deposit (either party may report recovery).
- As a tenant, I can see pricing, fee terms, and disclaimers ("information, not legal advice") prominently on intake, dashboard, and case detail.
- *[deferred post-MVP]* As a tenant, I see deadline-approaching warnings on my dashboard.

### Admin
- As an admin, I can see all cases filtered by status with key metrics (deposit amount, deadline, days overdue).
- As an admin, I can open a case and see full tenant, property, landlord, lease, and deposit details.
- As an admin, I can view, download, and preview every document the tenant has uploaded, grouped by kind.
- As an admin, I can change a case's status.
- As an admin, I can draft a demand letter (title + body + letter number 1–3). Saving a draft sets the case to `correspondence_ready`.
- As an admin, I can dispatch a staged letter to the landlord via email. Dispatch sends via Resend to `landlord_email`, sets status to `awaiting_landlord`, and notifies the tenant that Tribune sent a letter on their behalf.
- As an admin, I can post a visible update to the tenant (freeform message, no letter number).
- As an admin, I can add an internal note (hidden from tenant) or a tenant-visible note.
- As an admin, I can manually log a landlord reply (fallback for replies that arrive outside the automated inbound channel).
- As an admin, I can record recovery: amount recovered, fee calculated, any tenant-reimbursed costs, and mark the case resolved (either party may also report recovery).
- As an admin, I can decline a case at review. The flow captures an internal reason and a separate tenant-visible message; declining sets status to `declined`, emails the tenant a Tribune-voiced explanation plus pointers to free CT resources (NHLAA, CT Fair Housing, the § 47a-21 statute), and posts a tenant-visible timeline entry.
- *[deferred post-MVP]* As an admin, I can run AI extraction against uploaded documents.

## Main Flows

### Intake → Case Creation [current]

1. Visitor lands on `/login`, signs in via email/password or Google OAuth.
2. Authenticated user navigates to `/dashboard/new-case`.
3. User completes 4-step intake form (tenant info → property → landlord → deposit + contingency agreement).
4. On submit, a server action validates with Zod, inserts a `cases` row, upserts `profiles`, and redirects to the case detail page.

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
3. Admin sees: tenant/property/landlord/lease/deposit details, documents viewer, full timeline (including admin-only notes), status dropdown, letter draft form, update post form, note form (internal or visible), actions timeline, resolution controls.
4. Status changes and letter dispatches append `case_messages` entries of appropriate type. Letter dispatches increment `current_letter_number` (the only code path allowed to touch it).

### Letter Dispatch Flow

1. Admin drafts a demand letter (letter number 1–3, title, body) in `AdminWritePanel`.
2. Admin saves draft → case status moves to `correspondence_ready`. Letter body is stored as a `case_messages` row (`tribune_letter`, `is_admin_only = false`).
3. Admin reviews → clicks "Send via Email". Server action `dispatchLetter(caseId, channel='email')`:
   - Sends `renderLandlordLetterEmail()` to `landlord_email` via Resend.
   - Reply-to: `case+{caseId}@inbound.usetribune.org` (encodes case for inbound routing).
   - Sets case status `awaiting_landlord`.
   - Creates a `system` timeline entry: "Tribune sent Letter N to landlord via email."
   - Sends tenant notification: "We sent Letter N to [landlord name] on your behalf."
4. When landlord replies, Resend inbound webhook fires to `/api/webhooks/resend/inbound`:
   - Parses case ID from the To address.
   - Inserts `case_messages` row (`landlord_reply` type, body = email text).
   - Sets case status `landlord_responded`.
   - Notifies admin (email or in-app).
5. Admin manually logs a landlord reply if it arrives outside the inbound channel (phone, mail).

### Resolution

1. Either the tenant or admin reports recovery. Reporting party fills amount recovered in cents and any notes.
2. Server action sets status → `resolved`, records `resolved_at` and `resolution_notes`, updates `deposit_returned_cents`.
3. System auto-creates an `invoices` row (15% of recovered, due in 7 days) and sends invoice email to tenant via Resend.
4. Admin can mark the invoice paid (Venmo/Zelle/waived) via admin case detail. Stripe payment flow is planned.
5. If tenant does not pay within the agreed window, admin moves status to `in_collections`.

## Functional Requirements

- Authentication is email/password or Google OAuth via Supabase Auth.
- Data access from the application:
  - **Reads** go through the anon Supabase client from client components. RLS enforces who can read what.
  - **Writes** that require server-side integrity (intake, uploads, letter post, resolution, case_documents creation) go through server actions operating under the user's session.
- All money is stored and computed in integer cents.
- All dates are stored in Postgres `date` columns and exchanged as ISO date strings.
- The statutory deadline is `move_out_date + 21 days` (CT § 47a-21), stored on the case at creation time.
- The contingency rate default is 15% and is recorded on the case at creation time. Historical cases retain the rate they were created with.
- Letter numbers are 1, 2, or 3. `current_letter_number` is updated only when a letter is posted.
- Admin actions that change state also produce a visible timeline entry.
- Internal notes (`is_admin_only = true`) are invisible to tenants via RLS.
- Transactional email is sent via Resend on: new tenant-visible message posted, letter dispatched to landlord (outbound), landlord reply received (inbound auto-logged), status transition to `resolved`, status transition to `in_collections`.
- Inbound landlord email is received via Resend inbound webhook. Reply-to addresses encode the case ID (`case+{caseId}@inbound.usetribune.org`) for automatic routing.
- Letter templates use "our client, [Tenant Name]" framing — Tribune writes on behalf of tenant, not as the tenant. Exact statutory citations and damages language require human review before sending to any real landlord.

## Non-Functional Requirements

- **Legal accuracy.** The product drafts legal correspondence. Citations, deadlines, and damages calculations must be correct. Any change to legal content or legal math requires explicit human review.
- **PII handling.** The database stores tenant and landlord PII. No PII may be logged, sent to Sentry, or sent to PostHog. The analytics wrapper is the chokepoint.
- **Authorization boundary.** RLS is authoritative. Middleware is convenience only. Server actions run under the user's session.
- **Jurisdiction scope.** Connecticut only, residential only.
- **Audit trail.** The `case_messages` timeline is the de facto audit log. Every state change produces an entry.
- **UPL disclaimers.** Every tenant-facing page and outbound email carries an "information, not legal advice" disclaimer.

## Edge Cases

- Tenant's statutory deadline has already passed at intake time — accept; note in the timeline; case is still worth pursuing (statute-of-limitations distinct from the 21-day return deadline).
- Partial deposit return (non-zero `deposit_returned_cents` and non-zero `amount_withheld_cents`).
- No landlord email on file — letter delivery is by mail; email is nice-to-have. Dispatch flow currently requires `landlord_email`.
- Tenant submits a case for a property/landlord they've already submitted — accepted; no dedup yet.
- Landlord provides itemized deductions vs. not — different legal standard (strict vs. double damages). Reflected in letter content; not yet branched in admin flow.
- Admin changes status backward (e.g. `resolved` → `under_review`). Allowed; timeline shows the transition.
- Multiple tenants on one lease — MVP captures co-tenant names but one user account represents the case.
- Recovery is partial — recorded as `amount_recovered_cents` less than `amount_withheld_cents`. Case may still be marked `resolved`, or left `awaiting_landlord` if Tribune is pursuing the balance.
- Tenant fails to pay the contingency after recovery — status moves to `in_collections`.
- Tenant abandons the case / stops responding — status moves to `dead`.

## Assumptions

- One `cases` row per tenant per dispute. Tenants may have multiple cases over time.
- A single admin handles all cases manually at MVP scale. No concurrent-edit protection.
- Letter sequence escalates: letter 1 (initial demand) → letter 2 (follow-up) → letter 3 (final notice before escalation). Exact content is drafted by admin.
- Contingency is calculated on the amount *recovered*, not the amount *withheld*.
- Statutory deadline of `move_out + 21 days` per CT § 47a-21. Exact damages language for letter templates requires human review before production use.

## Open Questions

- How does Tribune handle cases where the statute of limitations has passed?
- Are there case-acceptance criteria (minimum amount, lease type)? Today the intake accepts any submission.
- What is the escalation path after letter 3? Small-claims filing package vs. referral out.
- If the tenant stops responding, how long before the case moves to `dead`? What notice is given?
- If the landlord pays partially, is the case considered resolved? Does Tribune pursue the remainder?
- What collections agency will Tribune partner with to make the collections threat real?
- UPL stance — exact language review for letters and tenant-facing copy, needed before real users.
