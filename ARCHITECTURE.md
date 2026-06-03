# Tribune — Architecture

Describes the system as built, decisions implicit in the code, risks, and recommended direction. Labels: **[current]**, **[inferred decision]**, **[risk]**, **[planned]**.

## Stack [current]

- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling / UI:** Tailwind CSS v3, shadcn/ui (Radix UI primitives — explicitly not `@base-ui/react`).
- **Forms / validation:** react-hook-form + zod.
- **Dates:** date-fns.
- **Toasts:** sonner.
- **Auth + DB:** Supabase (Postgres + Auth + RLS + Storage).
- **File storage:** Supabase Storage — `case-documents` bucket with RLS-scoped signed URLs.
- **Transactional email:** Resend — outbound case updates, letter dispatch to landlord, tenant notifications, invoice emails. Inbound: landlord replies via MX webhook (DNS not yet configured for prod).
- **Error monitoring:** Sentry — PII filtering via `beforeSend`, error boundaries at component/page/global levels.
- **Product analytics:** PostHog — anonymized user ids, event names only; PII scrubbing in analytics wrapper.
- **Testing:** Jest — unit tests for schemas, templates, email, constants (17+ passing). E2E (Playwright) planned.
- **Hosting:** Vercel — auto-deploy from `main`.

## App Structure [current]

```
src/
  app/
    page.tsx                      landing page
    layout.tsx                    root layout (PostHog provider, Sentry init)
    globals.css                   Tailwind + CSS variables (HSL)
    error.tsx, global-error.tsx   error boundaries
    icon.tsx                      app icon
    landing.module.css            landing-page-specific styles
    contact/page.tsx              static contact page (not linked in main nav)
    demo/case/page.tsx            static case-page mockup for marketing (linked from landing)
    login/page.tsx                email/password + Google OAuth, respects ?next=
    auth/
      callback/route.ts           OAuth code exchange
      signout/route.ts            sign out
    dashboard/
      layout.tsx                  auth guard + sidebar shell (streams immediately)
      page.tsx                    case list + stat cards
      new-case/page.tsx           4-step authenticated intake form
      case/[id]/
        page.tsx                  tenant case detail (stage rail, rounds, evidence, recovery)
        _components.tsx           all tenant case components
        actions.ts                tenant server actions
    admin/
      layout.tsx                  admin auth guard (is_admin check)
      page.tsx                    DataTable — all cases, sort/filter/search/paginate
      case/[id]/
        page.tsx                  admin case detail (contacts, assessment, write panel, timeline)
        actions.ts                admin server actions
    api/
      webhooks/resend/inbound/route.ts  parses landlord email replies, logs to timeline, sets status
  components/
    ui/                           shadcn components (Radix-based)
    app-sidebar.tsx               collapsible sidebar with case cards, status dots, deadline urgency
    case-timeline.tsx             timeline visualization
    data-table.tsx                generic @tanstack/react-table wrapper used by admin
    error-boundary.tsx            client error boundary
    legal-disclaimer.tsx          "information, not legal advice" banner
    navigation-progress.tsx       top-of-page progress bar on internal link clicks
  lib/
    supabase/
      client.ts                   browser client
      server.ts                   server action / RSC client
      middleware.ts               middleware client
    types/
      supabase.ts                 generated DB types (authoritative — supabase gen types)
      database.ts                 hand-written types (being phased out)
    schemas/
      intake.ts                   Zod schemas for intake form + server action
    analytics/
      posthog.tsx                 PostHog provider + scrubbed event helpers
    constants.ts                  CONTINGENCY_PCT=15, STATUTE_DAYS=21, PAYMENT_DUE_DAYS=7
    utils.ts                      shadcn cn() helper
    utils/case.ts                 case utility functions (status labels, deadline math)
    letters/templates.ts          CT § 47a-21 demand letter templates (1, 2, 3)
    email/
      client.ts                   Resend wrapper (sendEmail, replyTo support)
      templates/
        case-update.ts            tenant-facing case update notification email
        landlord-letter.ts        landlord demand letter email wrapper
        invoice.ts                tenant invoice email with Venmo/Zelle instructions
  middleware.ts                   route protection (/dashboard/* auth, /admin/* auth + is_admin)
supabase/
  migrations/                     versioned SQL migrations (authoritative schema source)
```

## Data Model [current]

**Enums**
- `case_status`: `intake_submitted` → `under_review` → `correspondence_ready` → `awaiting_landlord` → `landlord_responded` → `resolved` → `closed`. Terminal-but-off-path: `declined` (Tribune reviewed intake and chose not to take the case). Also defined (not yet actively used in UI flows): `awaiting_tenant`, `in_collections`, `dead`. `letter_sent` remains in the enum for historical rows but is deprecated — new flows use `awaiting_landlord`. Transitions are not enforced in the database.
- `message_type`: `tribune_letter`, `tribune_update`, `landlord_reply`, `system`.
- `action_type`: `letter_dispatched`, `landlord_reply_received`, `resolution_reported`, `payment_received`.
- `document_kind`: `lease`, `landlord_correspondence`, `deduction_itemization`, `photo`, `other`.
- `dispatch_channel`: `email` (SMS/mail planned).

**`profiles`** — extends `auth.users`. Fields: `id`, `email`, `full_name`, `phone`, `is_admin`, timestamps. Trigger `handle_new_user` auto-inserts on signup.

**`cases`** — one per tenant dispute. Tenant identity via `tenant_id`; property info; landlord info (name, email, phone, address); lease dates; `deposit_amount_cents`, `amount_withheld_cents`, `deposit_returned_cents`; withholding context; `contingency_pct` (stored at case creation — historical rows keep their rate); `current_letter_number`; `statutory_deadline`; resolution fields (`resolved_at`, `resolution_notes`); decline fields (`declined_at`, `decline_reason` — admin-only, `decline_message` — tenant-visible); timestamps.

**`case_messages`** — correspondence timeline. `case_id`, `message_type`, `title`, `body`, `letter_number`, `is_admin_only`, `created_by`, `dispatch_channel`, `dispatch_metadata` (jsonb), `created_at`.

**`case_actions`** — system-logged events. `case_id`, `action_type`, `metadata` (jsonb), `created_at`.

**`case_documents`** — tenant uploads. `case_id`, `kind`, `storage_path`, `original_filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`.

**`invoices`** — generated on recovery. `case_id`, `invoice_number` (`TRB-YYYY-NNNN` via `next_invoice_number()` SECURITY DEFINER), `amount_cents`, `due_date`, `status` (pending | paid | overdue | collections | waived), `paid_at`, `paid_method`, `paid_reference`, `stripe_payment_intent_id` (scaffold — not yet wired), `created_at`.

**RLS model**
- Tenants: read/write own profile; read/insert own cases; read non-`is_admin_only` messages on own cases; read/insert actions and documents on own cases.
- Admins: full read/update on all, gated by `is_admin()` SECURITY DEFINER function (prevents RLS recursion).

## Letter Dispatch Flow [current]

```
Admin drafts letter (AdminWritePanel — blank textarea, no template UI yet)
  ↓ postLetterWithNotification()
  Inserts case_message (tribune_letter), sets status → correspondence_ready
  ↓
Admin clicks "Send via Email"
  ↓ dispatchLetter(caseId, messageId, channel='email')
  Sends renderLandlordLetterEmail() to landlord_email via Resend
  reply-to: case+{caseId}@inbound.usetribune.org
  Sets status → awaiting_landlord
  Inserts system message + case_action (letter_dispatched)
  Sends tenant notification email
  ↓
Landlord replies to case+{caseId}@inbound.usetribune.org
  ↓ POST /api/webhooks/resend/inbound (Resend inbound webhook)
  Parses caseId from To address
  Inserts case_message (landlord_reply)
  Sets status → landlord_responded
  Notifies admin by email
  ↓ (or: admin manually logs reply via "Log Reply" tab)
  ↓
Admin or tenant reports recovery → reportRecovery() / adminReportRecovery()
  Updates deposit_returned_cents, sets status → resolved
  Inserts case_action (resolution_reported)
  Creates invoice row + sends invoice email (renderInvoiceEmail)
```

DNS/MX records for `inbound.usetribune.org` are not yet configured. Inbound webhook is built and tested but inactive until DNS is set.

## External Services [current]

- **Supabase** — auth + Postgres + RLS + Storage. All tables deployed via migrations.
- **Resend** — outbound: letter dispatch, tenant notifications, invoice email. Inbound webhook: `/api/webhooks/resend/inbound`. DNS/MX pending for prod.
- **Sentry** — error monitoring with PII scrubbing and source maps.
- **PostHog** — analytics with strict PII scrubbing in the analytics wrapper.
- **Vercel** — hosting, auto-deploy from `main`.
- **No payments processor** — Stripe column scaffolded on `invoices`; not yet wired.
- **No print-and-mail API** — admin dispatches via email only for now.
- **AWS Bedrock** — planned for Claude inference (document extraction, AI drafting) once that work starts. $10k credit pool.

## Implicit Technical Decisions [inferred decision]

1. **Reads client-side; writes via server actions.** Client components read directly from Supabase under RLS. Server actions handle all state-mutating writes. No API routes (except the Resend inbound webhook, which has no better home).
2. **RLS is the authorization boundary.** Middleware is convenience. Server actions run under the user's session — service role is reserved for narrowly scoped, reviewed admin jobs.
3. **Money as integer cents** throughout.
4. **Dates as ISO strings in the UI, `date` columns in Postgres.** date-fns for manipulation.
5. **Business constants centralized:** `src/lib/constants.ts` — `CONTINGENCY_PCT = 15`, `STATUTE_DAYS = 21`, `PAYMENT_DUE_DAYS = 7`, file limits.
6. **Letter templates exist** (`src/lib/letters/templates.ts`) with CT § 47a-21 content and placeholder interpolation. Admin uses paste-in-textarea flow; template UI is not yet wired.
7. **Manual status transitions.** No workflow engine. Transitions are enforced by convention only.
8. **Timeline is the audit log.** Every meaningful state change writes a `case_messages` row.
9. **snake_case throughout the data layer.** DB columns, Zod schemas, form field names.

## Technical Debt and Risks [risk]

- **Letter templates not wired to admin UI.** Admin must type or paste letter body manually. Templates in `src/lib/letters/templates.ts` are complete but unused in the write panel.
- **`letter_sent` status not purged.** Deprecated in the migration but still present in the enum and guarded against in UI conditionals. Should be backfilled to `awaiting_landlord` in a migration when safe.
- **Invoice payment is manual.** Stripe column exists on `invoices` but no payment flow is wired. Tenants get Venmo/Zelle copy-paste.
- **No deadline alerts.** `statutory_deadline` is stored on the case but nothing fires when it approaches. Cases can silently blow past the CT § 47a-21 window.
- **Inbound MX not live.** Landlord reply auto-logging is built but DNS not configured. All current replies must be logged manually.
- **`ADMIN_EMAIL` env var not set.** Inbound webhook falls back to hardcoded `hello@usetribune.org`.
- **Limited test coverage.** Jest unit tests for schemas, templates, email, constants. No E2E tests.
- **RLS correctness untested end-to-end.** No test confirms a tenant cannot read another tenant's case or documents.

## Recommended Next Work [planned]

**High leverage, near-term**
1. **Admin "Generate from template" UI.** Template picker (Letter 1/2/3) + preview with case data → populates textarea. Replaces blank-textarea flow. No new schema needed.
2. **Stripe invoice payment.** Wire `stripe_payment_intent_id` on `invoices`. Tenant payment page at `/dashboard/invoice/[id]`. Webhook marks paid on `payment_intent.succeeded`. Admin manual-pay flow remains.
3. **Deadline cron.** Vercel Cron or Supabase Scheduled Functions — daily sweep flagging cases within 3 days of `statutory_deadline`. Admin notification + dashboard badge.
4. **Inbound MX config + `ADMIN_EMAIL` env var.** Ops steps — no code changes needed. Activates the auto-logging webhook.

**Medium term**
5. **E2E test harness.** Playwright for intake → auth → dashboard → upload. Expand Jest coverage for deadline math, damages, fee calculations.
6. **Document extraction via Claude (Bedrock).** Upload landlord itemization letter → structured deduction fields → admin reviews extraction rather than re-reading PDF. Uses AWS credits.
7. **PDF generation.** Letters for tenant download and eventual print-and-mail pipeline.
8. **Print-and-mail API (Lob).** Automated letter delivery for landlords without email.

**Later**
- Collections integration — real agency relationship so the service agreement threat is literal.
- Small-claims filing package.
- Admin analytics (volume, recovery rate, time-to-resolve).
- Multi-jurisdiction expansion — moves statute references from code to a jurisdiction config.

## Things to Preserve

- RLS-first authorization.
- Integer cents for money.
- Timeline-as-audit-log.
- snake_case on the data layer.
- Typed Zod schemas at every write boundary.
- shadcn/Radix component stack (not `@base-ui/react`).
- "Information, not legal advice" as a first-class UI element, not a footer afterthought.
