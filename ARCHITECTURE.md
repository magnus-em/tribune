# Tribune — Architecture

This document describes the system as it is built today, the decisions implicit in the code, the risks those decisions carry, and the recommended direction from here. Sections are clearly labeled: **[current]**, **[inferred decision]**, **[risk]**, **[recommended]**.

## Stack [current]

- **Framework:** Next.js 14 (App Router), TypeScript.
- **Styling / UI:** Tailwind CSS v3, shadcn/ui components (Radix UI primitives — explicitly not `@base-ui/react`).
- **Forms / validation:** react-hook-form + zod.
- **Dates:** date-fns.
- **Toasts:** sonner.
- **Auth + DB:** Supabase (Postgres + Auth + RLS). Single external dependency.
- **Hosting:** *[uncertain — no deployment config checked in yet]*.

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
    types/database.ts             TS types for DB rows + status labels
  middleware.ts                   route protection
supabase/
  schema.sql                      full schema + RLS
```

## Data Model [current]

Four tables and three enums, defined in `supabase/schema.sql`.

**Enums**
- `case_status`: `intake_submitted` → `under_review` → `letter_ready` → `letter_sent` → `awaiting_landlord` → `landlord_responded` → `resolved` → `closed`. Transitions are not enforced in the database.
- `message_type`: `tribune_letter`, `tribune_update`, `tenant_response`, `tenant_landlord_reply`, `system`.
- `action_type`: `letter_sent`, `resolution_reported`, `payment_received`.

**`profiles`** — extends `auth.users`. Fields: `id`, `email`, `full_name`, `phone`, `is_admin`, `created_at`, `updated_at`. A trigger (`handle_new_user`) auto-inserts a row when a new auth user is created.

**`cases`** — one per tenant dispute. Holds tenant identity (via `tenant_id`), property info, landlord info, lease dates, deposit amounts (cents), withholding context, contingency terms, `current_letter_number`, `statutory_deadline`, timestamps.

**`case_messages`** — the correspondence timeline. Fields: `case_id`, `message_type`, `title`, `body`, `letter_number`, `is_admin_only`, `created_by`, `created_at`. Admin-only messages are hidden from tenants by RLS.

**`case_actions`** — tenant-confirmed actions. Fields: `case_id`, `action_type`, `metadata` (jsonb), `created_at`.

**RLS model**
- Tenants: read/write their own profile, read/insert for their own cases, read non-admin-only messages for own cases, read/insert actions on own cases.
- Admins: read/update all profiles, cases, messages, actions; determined by `exists (select 1 from profiles where id = auth.uid() and is_admin = true)`.
- Both roles get independent `SELECT` policies, which compose as OR — admin policies do not exclude tenant policies.

## External Services [current]

- **Supabase** — auth + Postgres + RLS. Only external dependency in production.
- **No email delivery service.** Outbound OTP email is handled by Supabase; no transactional email from the app.
- **No payments processor.**
- **No file storage usage yet** (Supabase Storage available but unused).
- **No cron / background job runner.**

## Implicit Technical Decisions [inferred decision]

These decisions are not written down anywhere but are strongly implied by the code. They should be treated as intentional unless explicitly revisited.

1. **All client components.** Every page under `src/app/` that touches data is marked `"use client"`. There are no server components reading data, no server actions, no API routes other than the auth callback and signout. The app is effectively a SPA on top of Next's routing.
2. **Direct Supabase client calls from UI.** Components import `createClient` and talk to Supabase directly. There is no repository, service, or hook layer abstracting data access.
3. **RLS is the authorization boundary.** Middleware checks if a session exists (and `is_admin` for `/admin/*`), but the real enforcement is RLS on every query. Anywhere the app "trusts" middleware for correctness is actually trusting RLS.
4. **Money as integer cents.** `deposit_amount_cents`, `amount_withheld_cents`, `deposit_returned_cents`. Never stored or computed as floats.
5. **Dates as ISO strings in the UI, `date` columns in Postgres.** `format(new Date(iso), ...)` is the established pattern. No Temporal, no Luxon.
6. **Business constants hardcoded in code, not config.** `CONTINGENCY_PCT = 25` in `intake/page.tsx`, `addDays(..., 30)` for statutory deadline, letter numbers 1–3 hardcoded in the admin `<Select>`. This is a deliberate choice while these values are stable business decisions, not config knobs.
7. **Intake state carried across auth via `sessionStorage`.** The bridge is: intake form → `sessionStorage["tribune_pending_case"]` → magic link email → `/auth/callback` reads and inserts. See `src/app/intake/page.tsx` and the callback route.
8. **Manual letter composition by admin.** No template system, no generation, no placeholders. Admin types or pastes letter body into a `<Textarea>`.
9. **Manual status transitions.** No workflow engine. An admin picks a new status from a `<Select>`. Status change creates a `system` timeline entry.
10. **Timeline is the audit log.** Every meaningful state change (status change, letter post) is also written to `case_messages` so it is reconstructible.
11. **Snake_case throughout data layer.** DB columns, Zod schemas, and form field names all snake_case. No `camelCase` shims on the boundary.

## Technical Debt and Risks [risk]

- **`current_letter_number` is updated in two handlers with different logic.** `changeStatus` increments it when transitioning to `letter_ready`; `postLetter` overwrites it to the selected letter number. Expect drift and fix before building on top of letter-number-dependent logic.
- **Intake `sessionStorage` bridge is brittle.** Any cross-device or cleared-session flow loses the pending case data silently. User ends up authenticated with no case. No recovery path.
- **No test suite.** No unit, integration, or e2e tests. Regressions are invisible until a user hits them.
- **No type-safe DB layer.** Types in `src/lib/types/database.ts` are hand-written and can drift from the actual schema. Supabase codegen would close this gap.
- **Legal text has no review pipeline.** Anything an admin pastes into a letter is what the tenant sees. There is no second set of eyes, no diff, no template lint for required citations.
- **Deadline awareness is read-only.** The DB has a deadline; the UI displays days overdue; but nothing acts on the deadline. Cases can silently pass their window.
- **No audit of admin access.** Any admin can read/write every case. Fine at current scale; a real risk once staff grows.
- **No dead-letter for failed auth-callback inserts.** If the `cases` insert fails after auth succeeds, the user is in a half-created state with no recovery path.
- **Hardcoded business constants** become a liability the moment they change. If the contingency rate changes, existing cases encode the old rate on the row (good), but every new code path that references the constant needs updating.
- **RLS tightness relative to product intent is untested.** No test confirms a tenant cannot read another tenant's case, admin-only messages, etc.

## Recommended Architecture From Here [recommended]

Each item is a recommendation, not current state. Labeled by leverage.

### High leverage, near-term
1. **Letter template module.** A `src/lib/letters/` directory with CT § 47a-21-specific templates, placeholder interpolation (`{{tenant_name}}`, `{{deposit_cents}}`, computed double-damages), and a pure-function API consumed by the admin UI. Keep letter bodies as data, not code strings.
2. **Move case creation server-side.** Replace the `sessionStorage` bridge with a server action or route handler that takes the intake payload, signs the user in (or creates them), and inserts the case atomically. The magic-link redirect becomes a simple "go to dashboard."
3. **Fix `current_letter_number` consistency.** Single source of truth for how the number is incremented. Probably: incremented only when a letter is posted; status changes never touch it.
4. **Supabase type codegen.** `supabase gen types typescript` → drop into `src/lib/types/database.ts`. Removes the hand-maintained drift risk.
5. **Minimal test harness.** Playwright for intake + auth callback + case detail happy paths. Vitest + Testing Library for any pure logic (deadline math, damages calc, letter interpolation).

### Medium leverage, next
6. **Transactional email via Resend.** Tenant notifications when a letter is posted, when status changes, when a deadline is near.
7. **Deadline cron.** Supabase Scheduled Functions or Vercel Cron. Daily sweep: cases at risk of passing their statutory deadline, cases where landlord hasn't responded in N days.
8. **File uploads via Supabase Storage.** Lease PDFs, scanned landlord letters, evidence photos. Link to `cases` via a `case_documents` table.
9. **PDF generation.** Letters to PDF for tenant download / for the automated mail pipeline.
10. **Letter delivery via print-and-mail API** (Lob or similar). Given the roadmap, this replaces the "tenant mails it themselves" model.

### Later
- Payments / invoicing (Stripe) once there are recovered settlements to collect on.
- Admin analytics (case volume, recovery rate, time-to-resolve).
- Multi-jurisdiction expansion — likely implies moving statute references from code to a data-driven jurisdiction config.

## Things to Preserve

- RLS-first authorization.
- Integer cents for money.
- Timeline-as-audit-log.
- Snake_case on the data layer.
- Typed Zod schemas for every write boundary.
- shadcn/Radix component stack.
