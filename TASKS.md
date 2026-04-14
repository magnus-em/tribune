# Tribune — Tasks

This document tracks implementation status and the next-up queue. It is intentionally not a detailed project management tool — it's a shared snapshot so every session starts from a clear picture of done / partial / next.

## Already Built

**Auth**
- [x] Supabase client/server/middleware utilities (`src/lib/supabase/`)
- [x] Magic link OTP login (`/login`)
- [x] Auth callback handler (`/auth/callback`)
- [x] Sign-out route (`/auth/signout`)
- [x] "Check your email" confirmation page (`/auth/confirm`)
- [x] Middleware protecting `/dashboard/*` (auth) and `/admin/*` (auth + `is_admin`)
- [x] Trigger auto-creating a `profiles` row on auth user signup

**Intake**
- [x] Landing page (`/`) with marketing content + FAQ
- [x] 4-step intake form (`/intake`) — tenant / property / landlord / deposit + contingency
- [x] Zod validation per step (`src/lib/schemas/intake.ts`)
- [x] Statutory deadline calculation (move_out + 30 days) at submit time
- [x] `sessionStorage` bridge carrying intake data across magic link redirect (to be replaced)
- [x] Case row insert in the auth callback after OTP success

**Tenant Dashboard**
- [x] Case list with status badges and key fields (`/dashboard`)
- [x] Case detail with correspondence thread, deposit summary, deadline tracking (`/dashboard/case/[id]`)
- [x] Copy-to-clipboard for letter bodies
- [x] "Confirm letter sent" action
- [x] Submit landlord response

**Admin**
- [x] Admin case list with status filters and summary stats (`/admin`)
- [x] Admin case detail (`/admin/case/[id]`):
  - [x] Full tenant + landlord + lease display
  - [x] Status change dropdown
  - [x] Post demand letter (title, body, letter number 1–3)
  - [x] Post tenant-visible update
  - [x] Add note (internal or tenant-visible)
  - [x] View tenant actions timeline

**Database**
- [x] `profiles`, `cases`, `case_messages`, `case_actions` tables
- [x] Enums for `case_status`, `message_type`, `action_type`
- [x] RLS policies for tenant + admin access
- [x] Auto-update `updated_at` triggers

**Infra / tooling**
- [x] Next.js 14 App Router skeleton
- [x] Tailwind v3 + shadcn/ui (Radix) components
- [x] `.env.example` with required vars
- [x] `CLAUDE.md`, `PRODUCT_BRIEF.md`, `SPEC.md`, `ARCHITECTURE.md` with full project context
- [x] Repo pushed to GitHub (`magnus-em/tribune`, private)

**YC Credits Claimed**
- [x] AWS $10k (Bedrock for Claude inference)
- [x] Anthropic $500 (reserved for product usage)
- [x] Cursor $720
- [x] Langfuse $600 off
- [x] Claude Code configured to use AWS Bedrock (preserves $500 Anthropic credits for product)

## Partial or Unclear

- **`current_letter_number` update logic** — updated in two places (`changeStatus` and `postLetter`) with inconsistent rules. Pre-slice refactor fixes this.
- **Letter posting** — admin can post letters, but there is no generation, no template, no placeholder interpolation. Everything is paste-in-textarea. Functionally works; strategically incomplete. Templates come post-MVP.
- **Status flow** — all status transitions are manual and unconstrained. No workflow, no auto-transition on actions, no invalid-transition guard. Acceptable for MVP.
- **Intake resilience** — `sessionStorage` bridge loses data if the magic link is opened on a different device or session. First vertical slice replaces this with server-side `pending_cases`.
- **Deadlines** — calculated and displayed, but no alerting, no reminder, no automatic escalation when a case passes its deadline. Post-slice work.
- **Types from DB** — hand-maintained `src/lib/types/database.ts`. Pre-slice refactor replaces with codegen.
- **Tests** — none. Post-slice.
- **README** — still the Next.js default. Low priority.
- **Legal review pipeline** — no second pair of eyes on letter content before it's posted to a tenant. Acceptable while one admin reviews everything manually.

## Next Up — Pre-Slice Refactors (Do These First)

These are small, self-contained fixes that must land before the first vertical slice. Each is one commit.

### 1. Fix `current_letter_number` Inconsistency
**File:** `src/app/admin/case/[id]/page.tsx`
**Problem:** `current_letter_number` is updated in two places with inconsistent rules.
**Fix:** Single source of truth — increment `current_letter_number` ONLY when a letter is posted, NEVER on status change.
**Acceptance:** Letter posts increment the number; status changes leave it untouched.

### 2. Supabase Type Codegen
**Command:** `npx supabase gen types typescript --project-id <project-id> > src/lib/types/supabase.ts`
**Fix:** Replace hand-written `src/lib/types/database.ts` with generated types.
**Update imports:** Change all `@/lib/types/database` imports to `@/lib/types/supabase`.
**Acceptance:** `npm run build` passes; no type errors; hand-written types file deleted.

## First Vertical Slice — "Tenant uploads documents, admin reviews, tenant sees update"

This is the smallest end-to-end implementation of the new product shape: document-centric workflow with admin review and transactional email. Everything after this builds on top without rework.

### Slice Goal
Tenant completes intake → uploads lease + documents → admin reviews uploads → admin posts update → tenant receives email notification.

### Components of the Slice

#### 1. Server-Side Intake (replaces `sessionStorage` bridge)
**New table:** `pending_cases` (id, email, payload jsonb, created_at, expires_at)
**New server action:** `src/app/intake/actions.ts` — `submitIntake(data)`:
  - Validates with Zod
  - Calls `supabase.auth.signInWithOtp({ email })`
  - Inserts to `pending_cases` with intake payload
  - Redirects to `/auth/confirm`

**Update:** `/auth/callback` after session exchange:
  - Server action finds `pending_cases` row by authenticated user's email
  - Inserts `cases` row from payload
  - Deletes `pending_cases` row
  - Redirects to `/dashboard`

**Migration:** Add `pending_cases` table + RLS (no direct client access; server action only).

**Acceptance:** Intake works cross-device (magic link opened on phone, different browser, etc.).

#### 2. Document Uploads
**New table:** `case_documents` (id, case_id, kind enum, storage_path, original_filename, content_type, size_bytes, uploaded_by, created_at)
**New enum:** `document_kind` — `lease`, `landlord_correspondence`, `deduction_itemization`, `photo`, `other`

**Supabase Storage:**
  - New bucket: `case-documents` with RLS
  - Tenant can upload to `case_documents/<case_id>/*` for own cases
  - Admin can read/write all

**New server action:** `src/app/dashboard/case/[id]/actions.ts` — `uploadDocument(caseId, file, kind)`:
  - Validates case ownership (RLS will enforce, but check in action too)
  - Generates signed upload URL scoped to case
  - Uploads to Storage
  - Inserts `case_documents` row
  - Appends `system` message to timeline ("Tenant uploaded {kind}: {filename}")

**Tenant UI:** `/dashboard/case/[id]` gains:
  - "Upload Documents" section with file picker + kind dropdown
  - List of uploaded documents grouped by kind
  - Download links

**Admin UI:** `/admin/case/[id]` gains:
  - "Documents" panel showing all uploads grouped by kind
  - Preview/download for each document

**Migration:** Add `case_documents` table + enum + RLS. Create Storage bucket + RLS policies.

**Acceptance:** Tenant uploads lease PDF → appears in admin documents panel → admin can download.

#### 3. Transactional Email (Resend)
**New dependency:** `npm install resend`
**New utility:** `src/lib/email.ts` — wrapper for Resend client
**New template:** `src/lib/email/templates/case-update.tsx` — simple React email for "New update on your case"

**Trigger:** When admin posts a tenant-visible message (`is_admin_only = false`), send email to `cases.tenant_email`.

**Email content:**
  - Subject: "New update on your case"
  - Body: message title + preview + link to case detail
  - Footer: "Information, not legal advice" disclaimer

**Env vars:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (e.g., `hello@tribune.xyz`)

**Acceptance:** Admin posts update → tenant receives email within 1 minute.

#### 4. "Information, Not Legal Advice" Disclaimers
**Add disclaimer banner to:**
  - `/intake` — top of first step
  - `/dashboard` — top of page
  - `/dashboard/case/[id]` — top of case detail
  - Email footer (all transactional emails)

**Copy (standardize across all surfaces):**
> **Legal Information, Not Legal Advice**
> Tribune provides information about Connecticut tenant rights and helps you prepare documents. We are not a law firm and do not provide legal advice. You are responsible for reviewing and signing all correspondence.

**Component:** `src/components/legal-disclaimer.tsx` — reusable banner

**Acceptance:** Disclaimer visible on intake, dashboard, case detail, and in email footer.

#### 5. Schema Migrations Summary
Run these in order:
1. Add `pending_cases` table + RLS
2. Add `document_kind` enum
3. Add `case_documents` table + RLS
4. Create `case-documents` Storage bucket + RLS policies
5. Add new `case_status` values: `awaiting_tenant`, `in_collections`, `dead`
6. Add new fields to `cases`: `amount_recovered_cents`, `fee_collected_cents`, `tenant_costs_cents`, `resolved_at`, `resolution_notes`

**Migration file:** `supabase/migrations/YYYYMMDDHHMMSS_first_slice.sql`

#### 6. Updated Dependencies
Add to `package.json`:
- `resend`

Update `.env.example`:
```
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@tribune.xyz
```

### Slice Acceptance Criteria (End-to-End)
1. Tenant completes intake on desktop → opens magic link on phone → case created successfully (no sessionStorage failure).
2. Tenant uploads lease PDF + landlord email screenshot.
3. Admin opens case → sees both uploads in Documents panel → can download.
4. Admin posts tenant-visible update.
5. Tenant receives email notification within 1 minute.
6. Disclaimer banner visible on intake, dashboard, case detail.
7. All migrations applied cleanly; `npm run build` passes; no type errors.

## After the Slice — High-Leverage Next Steps

Ordered by impact. Revisit after the slice lands.

1. **Letter template system** — `src/lib/letters/` with CT § 47a-21 templates, placeholder interpolation, double-damages calculator. Pure functions, no UI yet.
2. **Admin "Generate letter from template" UI** — picks template, previews with case data, edits, posts. Replaces blank-textarea flow.
3. **Expand transactional email** — send on letter posted, letter mailed, landlord response, resolution, collections.
4. **Deadline cron** — daily Supabase Scheduled Function or Vercel Cron flagging cases approaching statutory deadline.
5. **Minimal test harness** — Playwright for intake → auth → upload happy path. Vitest for deadline/damages/fee math.
6. **PDF export of letters** — tenant-downloadable, printable, groundwork for print-and-mail API.
7. **Document content extraction via Claude (Bedrock)** — upload landlord itemization letter → structured deduction fields → admin reviews extraction instead of re-reading PDF. Uses $10k AWS credits.
8. **Print-and-mail API (Lob or similar)** — automated certified mail delivery. Depends on #6.
9. **AI-drafted letters via Claude (Bedrock)** — pre-fills from templates + case data; admin still reviews every letter. Uses $10k AWS credits.
10. **Per-case inbound email (AgentMail)** — landlord replies land on case timeline automatically.

## Explicitly Deferred

These are known gaps deliberately pushed beyond MVP + first post-slice features.

- **Payments / invoicing / Stripe.** Settlement never flows through Tribune; tenant pays after recovery. Collections threat is off-platform for now.
- **Collections integration.** Real agency contract needed to make the threat literal; deferred until there are cases to collect on.
- **Multi-jurisdiction (non-CT) support.** CT-only for MVP; jurisdictional expansion requires config-driven statute references.
- **Admin analytics dashboard.** Case volume, recovery rate, time-to-resolve metrics. Post-launch.
- **SMS notifications.** Email-only for MVP.
- **Self-serve admin user management.** One admin (`is_admin` set manually in DB). Add admin UI when there are multiple admins.
- **Court filing assistance / small-claims package.** Mentioned in product copy as coming; not built in MVP.
- **Landlord-facing portal.** Not needed; correspondence is by mail.
- **Multi-tenant co-signers on one account.** MVP assumes one user per case; co-tenant names captured as data only.

## Open Questions / Needs Review Before Launch

- **Domain + email setup.** Register Tribune domain, configure Resend sending domain, set up forwarding email for AWS/Supabase/business accounts.
- **UPL-safe wording.** Letter templates and tenant-facing copy need attorney review before real users.
- **Collections pathway.** Formalize an agency contract before threatening collections in writing? Or acceptable to state intent and formalize when first case hits it?
- **Minimum case size.** Below what deposit amount is Tribune's time not worth the 15%? Defer until we have real cases to benchmark.
- **Escalation path after letter 3.** Structured small-claims package vs. referral out vs. "we've done what we can."
