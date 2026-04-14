# Tribune — Specification

This document describes what the product does today and the rules it operates under. Where the current implementation diverges from the intended behavior, that is noted.

## User Roles

- **Tenant** — the primary end user. Submits a case, reviews and sends demand letters, reports landlord responses, confirms resolution.
- **Admin** — Tribune staff. Triages incoming cases, composes and posts demand letters, updates case status, adds notes (internal or tenant-visible), records actions.

Admin access is granted via `profiles.is_admin = true`, set manually in the database. There is no self-serve admin signup.

## User Stories

### Tenant
- As a tenant, I can submit my case details through a guided intake form.
- As a tenant, I can sign in by email magic link.
- As a tenant, I can see all my cases and their current status.
- As a tenant, I can open a case to see its full timeline.
- As a tenant, I can read demand letters that Tribune has drafted for my case.
- As a tenant, I can copy a letter's text to my clipboard.
- As a tenant, I can confirm that I have sent a letter to my landlord.
- As a tenant, I can record a response received from my landlord.
- *[out of scope for MVP]* As a tenant, I receive notifications when new updates or letters are posted.

### Admin
- As an admin, I can see all cases filtered by status with key metrics (deposit amount, deadline, days overdue).
- As an admin, I can open a case and see full tenant, property, landlord, lease, and deposit details.
- As an admin, I can change a case's status.
- As an admin, I can post a demand letter (title + body + letter number 1–3) to a case.
- As an admin, I can post a visible update to the tenant.
- As an admin, I can add an internal note (hidden from tenant) or a tenant-visible note.
- As an admin, I can review the tenant's confirmed actions (letter sent, resolution, payment).
- *[out of scope for MVP]* As an admin, I can generate a letter from a CT § 47a-21 template pre-filled with case data.

## Main Flows

### Intake → Auth → Case Creation
1. Visitor lands on `/intake`, completes a 4-step form (tenant info → property → landlord → deposit + contingency agreement).
2. On submit, Tribune:
   - Calls `supabase.auth.signInWithOtp({ email })`, which creates the user if new and emails a magic link.
   - Stores the collected form data in `sessionStorage` under the key `tribune_pending_case`.
   - Redirects the user to `/auth/confirm`, instructing them to check email.
3. The user clicks the magic link, which routes to `/auth/callback`.
4. The callback exchanges the code for a session, reads `tribune_pending_case` from `sessionStorage`, inserts the `cases` row, and redirects to the dashboard.

**Known fragility:** the intake bridge depends on the user opening the magic link in the same browser session that started the intake. If they open the link on another device or after clearing session storage, the pending case data is lost. A server-side intake pipeline is on the task list.

### Tenant Dashboard
1. User visits `/dashboard`; middleware checks session.
2. User sees their list of cases.
3. User opens a case → `/dashboard/case/[id]`.
4. User reads the timeline, can copy letter text, can confirm a letter has been sent, can submit a landlord response.

### Admin Case Management
1. Admin visits `/admin`; middleware checks session AND `is_admin = true`.
2. Admin filters cases by status, opens a case → `/admin/case/[id]`.
3. Admin can: change status, post letter, post update, add note (internal or tenant-visible), view actions timeline.
4. Status changes and letter posts automatically append a `case_messages` entry of appropriate type.

## Functional Requirements

- Authentication is email magic link only. No password flow. OTP emails are delivered by Supabase Auth.
- Data access from the application is always through the anon Supabase client. RLS enforces who can read or write what.
- All money is stored and computed in integer cents.
- All dates are stored in Postgres `date` columns and exchanged as ISO date strings.
- The statutory deadline is calculated as `move_out_date + 30 days` and stored on the case record at creation time.
- The contingency fee rate is fixed at 25% and recorded on the case at creation time.
- Letter numbers are 1, 2, or 3.
- Admin actions that change state also produce a visible timeline entry, so the tenant (or admin) can reconstruct what happened.
- Internal notes (`is_admin_only = true`) are invisible to tenants via the RLS policy on `case_messages`.

## Non-Functional Requirements

- **Legal accuracy.** The product drafts legal correspondence. Citations, deadlines, and damages calculations must be correct. Any change to legal content or legal math requires explicit human review.
- **PII handling.** The database stores tenant and landlord PII (names, addresses, phone, email, forwarding address). No PII may be logged, sent to third-party analytics, or transmitted to external services without deliberate review.
- **Authorization boundary.** RLS is the authoritative authorization layer. Middleware-based route protection is a convenience only. Any new data access must assume RLS is the source of truth.
- **Jurisdiction scope.** Connecticut only. Case logic, statutes, and deadline math assume CT.
- **Accessibility and responsiveness.** Expected but not currently measured.
- **Audit trail.** The `case_messages` timeline serves as the de facto audit log. There is no separate audit log table.

## Edge Cases (known / to handle)

- Tenant's statutory deadline has already passed at intake time (case is still worth pursuing; code must not silently drop).
- Partial deposit return (non-zero `deposit_returned_cents` and non-zero `amount_withheld_cents`).
- No landlord email on file — letter delivery path must still work when it exists.
- Tenant opens magic link on different device → intake bridge loses pending case. Currently unhandled.
- Tenant submits a case for a property/landlord they've already submitted. No dedup today.
- Landlord provides itemized deductions vs. not — affects legal standard but not yet branched in letter drafting.
- Admin changes status backward (e.g. `resolved` → `under_review`). Allowed today; timeline will show the transition.
- `current_letter_number` is updated in two different handlers (`postLetter` and `changeStatus`) with inconsistent logic — a known bug, see ARCHITECTURE.md.

## Assumptions

- Users complete intake and open their magic link on the same device within the OTP expiry window.
- One `cases` row per tenant per dispute. Tenants may have multiple cases over time.
- A single admin handles most cases manually at MVP scale. No concurrent-edit protection.
- Letter sequence escalates: letter 1 (initial demand) → letter 2 (follow-up) → letter 3 (final notice before escalation). Exact content is drafted by admin.
- Contingency is calculated on the amount *recovered*, not the amount *withheld*.
- `statutory_deadline` of move_out + 30 days reflects the CT statutory framework. *[uncertain — exact statute subsection to cite in letter templates]*.

## Open Questions

- How does Tribune handle cases where the statute of limitations has passed?
- Are there case-acceptance criteria (minimum amount, jurisdiction, lease type)? Today the intake accepts any submission.
- What is the escalation path after letter 3? Small-claims court filing help? Referral out?
- If the tenant stops responding, how is the case closed? Who triggers it, and what notice is given?
- If the landlord pays partially, is the case considered resolved? Does Tribune pursue the remainder?
- How are contingency payments collected in practice (invoiced from tenant after recovery, withheld from a settlement account)?
- UPL stance — since no attorney is in the loop, exactly what language is safe in letters and tenant-facing copy?
- Letter-delivery automation — print-and-mail API, certified mail tracking, signature confirmation?
- Multi-tenant roommates on a single lease — one case, multiple tenants?
