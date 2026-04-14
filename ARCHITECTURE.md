# Tribune — Architecture

This document describes the system as it is built today, the decisions implicit in the code, the risks those decisions carry, and the recommended direction from here. Sections are labeled: **[current]**, **[inferred decision]**, **[risk]**, **[planned]**, **[recommended]**.

## Stack [current]

- **Framework:** Next.js 14 (App Router), TypeScript.
- **Styling / UI:** Tailwind CSS v3, shadcn/ui components (Radix UI primitives — explicitly not `@base-ui/react`).
- **Forms / validation:** react-hook-form + zod.
- **Dates:** date-fns.
- **Toasts:** sonner.
- **Auth + DB:** Supabase (Postgres + Auth + RLS).
- **File storage:** Supabase Storage (to be adopted in the first vertical slice).
- **Transactional email:** Resend (to be adopted in the first vertical slice).
- **Error monitoring:** Sentry (to be adopted).
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
    types/database.ts             TS types for DB rows + status labels (to be replaced by codegen)
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

**New `case_status` values:** `awaiting_tenant` (Tribune needs something from the tenant), `in_collections` (post-recovery non-payment), `dead` (tenant abandoned).

**New `message_type` value:** `tenant_document_uploaded` — emitted by the upload server action. (Alternative: reuse `system`. Decide when implementing.)

**New `action_type` values:** `letter_mailed` (admin marks a physical letter as mailed), `recovery_confirmed` (admin marks recovery), `invoice_sent`, `invoice_paid`.

**Default contingency rate:** 15 (was 25). Historical rows keep their stored rate.

## External Services [current / planned]

- **Supabase** — auth + Postgres + RLS + Storage [current + planned]. Only external production dependency today.
- **Resend** — transactional email [planned]. Sender address on Tribune's custom domain.
- **Sentry** — error monitoring [planned]. Release tracking, source maps. PII scrubbed before send.
- **PostHog** — product analytics [planned]. Anonymized user ids, event names only; scrubbing in the analytics wrapper.
- **AWS (Bedrock)** — [planned, future] the inference backend for Claude calls when AI drafting and document parsing land. Paid from the AWS credit pool.
- **No payments processor** [current and MVP]. Settlements never flow through Tribune.
- **No print-and-mail API** [current and MVP]. Admin mails physically.

## Implicit Technical Decisions [inferred decision]

1. **Reads client-side; writes via server actions.** Reads continue to go from client components to Supabase directly under RLS. Writes that must have server-side integrity — intake, uploads, letter posts, resolution — go through Next.js server actions operating under the user's session. No API routes, no repository layer. This is a revision of the prior "all client components" stance. Do not re-expand server-side code without explicit discussion.
2. **RLS is the authorization boundary.** Middleware checks session (and `is_admin` for `/admin/*`). Real enforcement is RLS. Server actions run under the user's session — service role is reserved for narrowly scoped, reviewed admin jobs.
3. **Money as integer cents** throughout.
4. **Dates as ISO strings in the UI, `date` columns in Postgres.** date-fns for manipulation.
5. **Business constants hardcoded:** `CONTINGENCY_PCT = 15`, `STATUTE_DAYS = 30`, letter numbers 1–3. Deliberate while these are business rules, not config.
6. **Manual letter composition by admin** in MVP. No template system, no generation, no AI.
7. **Manual status transitions.** No workflow engine.
8. **Timeline is the audit log.** Every meaningful state change writes to `case_messages`.
9. **snake_case throughout the data layer.** DB columns, Zod schemas, form field names.
10. **Typed Zod schemas at every write boundary.**

## Technical Debt and Risks [risk]

- **`current_letter_number` inconsistency.** Updated in two handlers today. Canonical rule going forward: incremented only on letter post.
- **Intake `sessionStorage` bridge is brittle.** Replaced by the `pending_cases` server-side pipeline in the first slice.
- **No test suite.**
- **No type-safe DB layer.** Hand-written `src/lib/types/database.ts` will drift. Replace with `supabase gen types typescript`.
- **Legal text has no review pipeline** beyond admin self-review. Acceptable while admin is one person and every letter is personally approved.
- **Deadline awareness is read-only.** No alerts, no cron. Acceptable for MVP.
- **No audit of admin access.** One admin today.
- **No dead-letter for failed auth-callback inserts.** The `pending_cases` model makes this recoverable — the row persists until consumed and can be retried.
- **Hardcoded business constants** become a liability the moment they change. Historical rows storing their own rate/deadline mitigates part of this.
- **RLS tightness relative to product intent is untested.** No test confirms a tenant cannot read another tenant's case or documents.

## First Vertical Slice [planned]

"Tenant uploads a document and sees Tribune respond." End-to-end:

1. Server-action intake replaces the `sessionStorage` bridge. `pending_cases` table + server action + consumption in `/auth/callback`.
2. `case_documents` table, Supabase Storage bucket, RLS-scoped signed URLs.
3. Tenant case detail gains an Uploads section (upload, list, per-kind grouping).
4. Admin case detail gains a Documents panel (view, download, per-kind grouping).
5. Resend integration for one transactional email: "New update on your case" when the admin posts a tenant-visible message.
6. "Information, not legal advice" disclaimer on intake, dashboard, case detail.
7. Pre-slice refactors (single commit each): fix `current_letter_number` rule; run Supabase type codegen and replace hand-written types.

This slice establishes the new product shape. Letter templates, AI drafting, PDF, print-and-mail, collections pipeline all layer on top without rework.

## Recommended Architecture From Here [recommended]

### High leverage, near-term (after the first slice)
1. **Letter template module.** `src/lib/letters/` with CT § 47a-21-grounded templates, placeholder interpolation (`{{tenant_name}}`, `{{deposit_cents}}`, computed double-damages), pure-function API. Letter bodies as data.
2. **Document-content extraction via Claude (Bedrock).** Upload landlord itemization letter → structured deduction fields → admin reviews the extraction rather than re-reading the PDF.
3. **Transactional email expansion.** Beyond the first event, send on letter post, letter mailed, landlord response recorded, resolution, collections.
4. **Deadline cron.** Daily sweep via Supabase Scheduled Functions or Vercel Cron flagging cases at risk of passing their statutory deadline.
5. **Minimal test harness.** Playwright for intake → auth callback → dashboard → upload. Vitest for deadline, damages, fee math.

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
