# Tribune — Architecture

This document describes the system as it is built today, the decisions implicit in the code, the risks those decisions carry, and the recommended direction from here. Sections are labeled: **[current]**, **[inferred decision]**, **[risk]**, **[planned]**, **[recommended]**.

## Stack [current]

- **Framework:** Next.js 14 (App Router), TypeScript.
- **Styling / UI:** Tailwind CSS v3, shadcn/ui components (Radix UI primitives — explicitly not `@base-ui/react`).
- **Forms / validation:** react-hook-form + zod.
- **Dates:** date-fns.
- **Toasts:** sonner.
- **Auth + DB:** Supabase (Postgres + Auth + RLS).
- **File storage:** Supabase Storage [current] — document uploads with RLS-scoped bucket.
- **Transactional email:** Resend [current] — case update notifications.
- **Error monitoring:** Sentry [current] — configured with PII filtering, error boundaries at component/page/global levels.
- **Testing:** Jest [current] — unit tests for schemas, templates, constants. Playwright for E2E (planned).
- **Product analytics:** PostHog (to be adopted) — with strict PII scrubbing.
- **Hosting:** Vercel (default assumption; not yet provisioned). AWS credits are available as a fallback pool and are the chosen backend for any Claude inference the product makes (via Amazon Bedrock) once AI drafting lands.

## App Structure [current]

```
src/
  app/
    page.tsx                      landing page
    layout.tsx                    root layout
    globals.css                   Tailwind + CSS variables (HSL)
    intake/page.tsx               4-step intake form
    login/page.tsx                magic link request
    auth/
      callback/route.ts           OTP code exchange + pending-case insert
      confirm/page.tsx            "check your email" screen
      signout/route.ts            sign out
    dashboard/
      layout.tsx                  auth guard (client)
      page.tsx                    case list
      case/[id]/page.tsx          case detail, tenant view
    admin/
      layout.tsx                  admin auth guard (client)
      page.tsx                    case list with status filters
      case/[id]/page.tsx          case detail, admin tools
  components/ui/                  shadcn components
  lib/
    supabase/
      client.ts                   browser client
      server.ts                   RSC / route handler client
      middleware.ts               middleware client
    schemas/intake.ts             zod schemas for intake
    types/supabase.ts             Generated DB types via `supabase gen types`
    types/database.ts             Legacy hand-written types (deprecated, will be removed)
    constants.ts                  Centralized business constants (contingency %, statute days, file limits)
    letters/templates.ts          CT § 47a-21 demand letter templates (1, 2, 3)
    email/
      client.ts                   Resend wrapper
      templates/case-update.ts    Email template for case updates
  middleware.ts                   route protection
supabase/
  schema.sql                      full schema + RLS
```

## Data Model

### Current [current]

Four tables and three enums in `supabase/schema.sql`.

**Enums**
- `case_status`: `intake_submitted` → `under_review` → `letter_ready` → `letter_sent` → `awaiting_landlord` → `landlord_responded` → `resolved` → `closed`. Transitions are not enforced in the database.
- `message_type`: `tribune_letter`, `tribune_update`, `tenant_response`, `tenant_landlord_reply`, `system`.
- `action_type`: `letter_sent`, `resolution_reported`, `payment_received`.

**`profiles`** — extends `auth.users`. Fields: `id`, `email`, `full_name`, `phone`, `is_admin`, timestamps. Trigger `handle_new_user` auto-inserts on signup.

**`cases`** — one per tenant dispute. Tenant identity via `tenant_id`; property info; landlord info; lease dates; deposit amounts (cents); withholding context; contingency terms; `current_letter_number`; `statutory_deadline`; timestamps.

**`case_messages`** — correspondence timeline. `case_id`, `message_type`, `title`, `body`, `letter_number`, `is_admin_only`, `created_by`, `created_at`.

**`case_actions`** — tenant-confirmed actions. `case_id`, `action_type`, `metadata` (jsonb), `created_at`.

**RLS model**
- Tenants: read/write own profile, read/insert own cases, read non-admin-only messages on own cases, read/insert actions on own cases.
- Admins: read/update all, determined by `exists (select 1 from profiles where id = auth.uid() and is_admin = true)`.

### Planned changes [planned]

These land as part of the first vertical slice.

**New table: `pending_cases`**
- `id`, `email` (indexed, unique), `payload` (jsonb — the intake form data), `created_at`, `expires_at`.
- Populated by the intake server action before the magic link is sent. Consumed by `/auth/callback` after session exchange. Deleted on consumption or expiry.
- RLS: no direct client access. Only the server action and the auth callback touch it (via the user's session, matching on email).

**New table: `case_documents`**
- `id`, `case_id`, `kind` (enum: `lease`, `landlord_correspondence`, `deduction_itemization`, `photo`, `other`), `storage_path`, `original_filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`.
- RLS: tenant can read/insert for own cases. Admin can read/insert/delete all.

**New table: `case_parties`** — stub in schema now, populated later.
- `id`, `case_id`, `role` (enum: `co_tenant`, `landlord`, `property_manager`), `full_name`, `email`, `phone`, `created_at`.
- MVP keeps flat landlord/tenant fields on `cases`. `case_parties` exists so co-tenants and multi-party landlords don't require a schema migration later.

**New fields on `cases`:**
- `amount_recovered_cents` (nullable), `fee_collected_cents` (nullable), `tenant_costs_cents` (nullable, reimbursable mailing + filing), `resolved_at` (nullable), `resolution_notes` (nullable text).

**New `case_status` values:** [current]
- `awaiting_tenant` (Tribune needs something from the tenant), `in_collections` (post-recovery non-payment), `dead` (tenant abandoned).

**New `action_type` values:** [planned]
- `letter_mailed` (admin marks a physical letter as mailed), `recovery_confirmed` (admin marks recovery), `invoice_sent`, `invoice_paid`.

**Current contingency rate:** 10%. Historical rows keep their stored rate if it ever changes.

## External Services [current / planned]

- **Supabase** — auth + Postgres + RLS + Storage [current]. All tables from first slice (pending_cases, case_documents) are deployed.
- **Resend** — transactional email [current]. Sends "case update" notifications when admin posts tenant-visible messages. Sender address on Tribune's custom domain. Inbound email via Cloudflare Email Routing (planned for future AI analysis of landlord responses).
- **Sentry** — error monitoring [current]. Release tracking, source maps. PII scrubbed before send (emails, phone numbers filtered via beforeSend hooks).
- **PostHog** — product analytics [planned]. Anonymized user ids, event names only; scrubbing in the analytics wrapper.
- **AWS (Bedrock)** — [planned, future] the inference backend for Claude calls when AI drafting and document parsing land. Paid from the AWS credit pool.
- **No payments processor** [current and MVP]. Settlements never flow through Tribune.
- **No print-and-mail API** [current and MVP]. Admin mails physically.

## Implicit Technical Decisions [inferred decision]

1. **Reads client-side; writes via server actions.** Reads continue to go from client components to Supabase directly under RLS. Writes that must have server-side integrity — intake, uploads, letter posts, resolution — go through Next.js server actions operating under the user's session. No API routes, no repository layer. This is a revision of the prior "all client components" stance. Do not re-expand server-side code without explicit discussion.
2. **RLS is the authorization boundary.** Middleware checks session (and `is_admin` for `/admin/*`). Real enforcement is RLS. Server actions run under the user's session — service role is reserved for narrowly scoped, reviewed admin jobs.
3. **Money as integer cents** throughout.
4. **Dates as ISO strings in the UI, `date` columns in Postgres.** date-fns for manipulation.
5. **Business constants centralized:** `src/lib/constants.ts` — `CONTINGENCY_PCT = 10`, `STATUTE_DAYS = 30`, file size/type limits, letter numbers 1–3. Single source of truth.
6. **Letter templates exist** (`src/lib/letters/templates.ts`) with CT § 47a-21 content, placeholder interpolation, and double-damages calculation. Admin still uses paste-in-textarea flow; "Generate from template" UI is the next high-leverage feature.
7. **Manual status transitions.** No workflow engine.
8. **Timeline is the audit log.** Every meaningful state change writes to `case_messages`. Timeline visualization component shows move-out, deadline, letters, responses with icons and color-coding.
9. **snake_case throughout the data layer.** DB columns, Zod schemas, form field names.
10. **Typed Zod schemas at every write boundary.**

## Technical Debt and Risks [risk]

- **Letter templates not integrated in admin UI.** Templates exist with proper CT § 47a-21 content, but admin still uses blank textarea. Need "Generate from template" button and preview UI.
- **Limited test coverage.** Jest unit tests exist for schemas, templates, email, and constants (17+ tests passing). No E2E tests yet. Playwright planned for intake → auth → upload flow.
- **Email triggers incomplete.** Email sends on case updates, but not yet on: letter posted, letter mailed, landlord response, resolution, collections.
- **Legal text has no review pipeline** beyond admin self-review. Acceptable while admin is one person and every letter is personally approved.
- **Deadline awareness is read-only.** No alerts, no cron. Acceptable for MVP.
- **No audit of admin access.** One admin today.
- **RLS tightness relative to product intent is untested.** No E2E test confirms a tenant cannot read another tenant's case or documents.

## First Vertical Slice [complete]

"Tenant uploads a document and sees Tribune respond." Completed end-to-end:

1. ✅ Server-action intake replaces the `sessionStorage` bridge. `pending_cases` table + server action + consumption in `/auth/callback`.
2. ✅ `case_documents` table, Supabase Storage bucket, RLS-scoped signed URLs.
3. ✅ Tenant case detail gains an Uploads section (upload, list, per-kind grouping).
4. ✅ Admin case detail gains a Documents panel (view, download, per-kind grouping).
5. ✅ Resend integration for transactional email: "New update on your case" when the admin posts a tenant-visible message.
6. ✅ "Information, not legal advice" disclaimer on intake, dashboard, case detail, email footer.
7. ✅ Pre-slice refactors: fixed `current_letter_number` rule; Supabase type codegen; centralized business constants.

**Additional work completed:**
- ✅ Letter template system (`src/lib/letters/templates.ts`) with CT § 47a-21 templates (Letters 1, 2, 3).
- ✅ Jest testing infrastructure with tests for schemas, templates, email, constants.
- ✅ Sentry error tracking with PII filtering and error boundaries.
- ✅ Timeline visualization component for case detail pages.
- ✅ Landing page redesigns (game theory focus, strategic negotiation).

This slice establishes the new product shape. AI drafting, PDF export, print-and-mail, collections pipeline layer on top without rework.

## Recommended Architecture From Here [recommended]

### High leverage, near-term (first slice complete — these are next)
1. **Admin "Generate from template" UI.** Letter templates exist; need button in admin UI to select template, preview with case data, edit, and post. Replaces blank-textarea flow.
2. **Transactional email expansion.** Beyond case updates, send on letter posted, letter mailed, landlord response recorded, resolution, collections.
3. **Deadline cron.** Daily sweep via Supabase Scheduled Functions or Vercel Cron flagging cases at risk of passing their statutory deadline.
4. **E2E test harness.** Playwright for intake → auth callback → dashboard → upload. Expand Jest coverage for deadline, damages, fee math.
5. **Document-content extraction via Claude (Bedrock).** Upload landlord itemization letter → structured deduction fields → admin reviews the extraction rather than re-reading the PDF. Uses $10k AWS credits.

### Medium leverage
6. **PDF generation** of letters for tenant download and the automated-mail pipeline.
7. **Print-and-mail API** (Lob or similar) for automated letter delivery.
8. **AI-drafted letters.** Pre-filled from the template module + extracted case data. Admin still reviews every letter.
9. **Per-case inbound email** (AgentMail or similar) so landlord replies land on the case timeline.

### Later
- Payments / invoicing (Stripe) once there are recovered settlements to reliably collect on.
- Collections integration — a real agency relationship so the threat in the contingency agreement is literal.
- Small-claims filing package.
- Admin analytics (case volume, recovery rate, time-to-resolve).
- Multi-jurisdiction expansion — moves statute references from code to a jurisdiction config.

## Things to Preserve

- RLS-first authorization.
- Integer cents for money.
- Timeline-as-audit-log.
- snake_case on the data layer.
- Typed Zod schemas at every write boundary.
- shadcn/Radix component stack.
- "Information, not legal advice" as a first-class UI element, not a footer afterthought.
