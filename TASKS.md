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
- [x] Supabase generated types (`src/lib/types/supabase.ts`) replacing hand-written types
- [x] Centralized business constants (`src/lib/constants.ts`) — single source of truth for contingency %, statute days, file limits
- [x] Jest testing infrastructure with test, test:watch, and test:coverage scripts
- [x] Sentry error tracking (client, server, edge) with PII filtering and error boundaries
- [x] `current_letter_number` fixed — now only increments on letter post, never on status change

**Server-Side Intake & Document Workflow** (First Vertical Slice — Complete)
- [x] `pending_cases` table for cross-device intake resilience
- [x] Server action: `submitIntake` — validates, sends OTP, stores payload in `pending_cases`
- [x] Auth callback consumes `pending_cases` → creates case → deletes pending row
- [x] `case_documents` table with `document_kind` enum (lease, landlord_correspondence, deduction_itemization, photo, other)
- [x] Supabase Storage bucket `case-documents` with RLS policies
- [x] Server action: `uploadDocument` — handles file upload with kind tagging
- [x] Tenant UI: upload documents section with file picker and kind dropdown
- [x] Admin UI: documents panel showing all uploads grouped by kind with download links
- [x] Intake now works cross-device (magic link opened on different browser/phone)

**Transactional Email** (Resend)
- [x] Resend client wrapper (`src/lib/email/client.ts`)
- [x] Email template: `case-update.ts` with legal disclaimer footer
- [x] Email trigger: admin posts tenant-visible update → tenant receives notification
- [x] Resend API key configured in Vercel env (optional for MVP testing)

**Letter Templates**
- [x] Letter template system (`src/lib/letters/templates.ts`)
- [x] CT § 47a-21 demand letter templates (Letter 1, 2, 3)
- [x] Escalating tone and urgency across letters
- [x] Proper statute citations and double-damages calculation
- [x] Placeholder interpolation for case data

**Legal Compliance**
- [x] Legal disclaimer component (`src/components/legal-disclaimer.tsx`)
- [x] Disclaimer visible on intake, dashboard, case detail
- [x] Disclaimer in email footer

**UI Components & UX**
- [x] Case timeline visualization component (`src/components/case-timeline.tsx`)
- [x] Timeline shows move-out date, statutory deadline, letters, responses with icons and color-coding
- [x] Error boundaries at component, page, and global levels
- [x] Empty state, error message, and loading spinner components
- [x] Multiple landing page iterations (game theory focus, strategic negotiation, tenant rights)

**Testing**
- [x] Test suite for business constants (contingency, statute days, file limits)
- [x] Test suite for intake schema validation (tenant info, property, deposit, dates, amounts)
- [x] Test suite for letter templates
- [x] Test suite for email templates
- [x] 17+ passing tests with coverage tracking

**YC Credits Claimed**
- [x] AWS $10k (Bedrock for Claude inference)
- [x] Anthropic $500 (reserved for product usage)
- [x] Cursor $720
- [x] Langfuse $600 off
- [x] Claude Code configured to use AWS Bedrock (preserves $500 Anthropic credits for product)

## Partial or Unclear

- **Letter template integration with admin UI** — letter templates exist (`src/lib/letters/templates.ts`) with CT § 47a-21 content and placeholder interpolation, but admin still uses paste-in-textarea flow. Need "Generate from template" UI that picks template, previews with case data, allows editing, then posts.
- **Status flow** — all status transitions are manual and unconstrained. No workflow, no auto-transition on actions, no invalid-transition guard. Acceptable for MVP.
- **Deadlines** — calculated and displayed, but no alerting, no reminder, no automatic escalation when a case passes its deadline. Needs cron job.
- **Email triggers** — email sends on case updates, but not yet on: letter posted, letter mailed, landlord response, resolution, collections.
- **README** — still the Next.js default. Low priority.
- **Legal review pipeline** — no second pair of eyes on letter content before it's posted to a tenant. Acceptable while one admin reviews everything manually.

## Next Up — High-Leverage Features

Pre-slice refactors and first vertical slice are complete. These are the next high-impact features, roughly ordered by priority.

### 1. Admin "Generate Letter from Template" UI
**Status:** Letter templates exist with CT § 47a-21 content; need UI integration.

**What to build:**
- Admin case detail page: "Generate Letter" button
- Modal: select letter template (1, 2, or 3)
- Preview pane: show template with case data interpolated
- Edit pane: admin can modify generated letter before posting
- Post button: saves to case_messages and sends email to tenant

**Files:**
- Existing: `src/lib/letters/templates.ts` (has `generateLetter()` function)
- Add to: `src/app/admin/case/[id]/page.tsx`

**Acceptance:** Admin clicks "Generate Letter 1" → sees preview with tenant/landlord names filled in → edits if needed → posts to case.

---

### 2. Expand Transactional Email Triggers
**Status:** Email sends on case updates; needs more triggers.

**What to build:**
Add email triggers for:
- Letter posted (admin posts demand letter → tenant gets notification)
- Letter mailed (admin marks letter as physically mailed → tenant confirmation)
- Landlord response submitted (tenant logs landlord response → confirmation email)
- Case resolved (admin marks resolved → tenant summary email)
- Collections initiated (admin moves to collections status → tenant warning email)

**Files:**
- `src/lib/email/templates/` — add new templates
- `src/app/admin/case/[id]/actions.ts` — add email triggers to existing actions

**Acceptance:** Each event sends appropriate email to tenant.

---

### 3. Deadline Alert Cron
**Status:** Deadlines calculated and displayed; no automated alerts.

**What to build:**
- Vercel Cron endpoint (`/api/cron/check-deadlines`)
- Runs daily at 9 AM ET
- Finds cases where `statutory_deadline` is within 7 days and status is `active` or `demand_sent`
- Sends email to admin with list of approaching deadlines
- Optional: send tenant reminder at 3 days before deadline

**Files:**
- `src/app/api/cron/check-deadlines/route.ts`
- `src/lib/email/templates/deadline-alert.ts`
- `vercel.json` — add cron schedule

**Acceptance:** Cron runs daily; admin receives email when cases have deadlines approaching.

---

### 4. PDF Export of Letters
**Status:** Letters displayed in browser; need downloadable PDF.

**What to build:**
- PDF generation library (consider `@react-pdf/renderer` or `puppeteer` for server-side)
- "Download Letter as PDF" button on tenant and admin case detail
- PDF format: Tribune letterhead, case details, letter body, tenant signature line
- Groundwork for print-and-mail API integration

**Files:**
- `src/lib/pdf/` — PDF generation utilities
- `src/app/api/case/[id]/download-letter/route.ts` — API route to generate and return PDF

**Acceptance:** Tenant clicks "Download Letter 1" → receives PDF with proper formatting ready to print/mail.

---

### 5. E2E Test Harness (Playwright)
**Status:** Unit tests exist; need integration tests for critical flows.

**What to build:**
- Playwright setup with test scripts
- Test: intake → auth → dashboard (happy path)
- Test: upload document → admin sees document
- Test: admin posts update → tenant sees update
- Run in CI on PRs

**Files:**
- `playwright.config.ts`
- `tests/e2e/intake-flow.spec.ts`
- `tests/e2e/upload-flow.spec.ts`

**Acceptance:** `npm run test:e2e` runs full intake-to-resolution flow against local Supabase.

---

### 6. Document Content Extraction via Claude (Bedrock)
**Status:** Documents uploaded manually; admin reads PDFs by hand.

**What to build:**
- Server action: `extractDocumentContent(documentId)`
- Calls AWS Bedrock Claude to extract structured data from uploaded PDFs
- For landlord itemization letters: extract deductions (category, amount, description)
- For lease PDFs: extract deposit amount, lease dates, landlord name/address
- Admin reviews extracted data in UI before confirming
- Uses $10k AWS Bedrock credits

**Files:**
- `src/lib/bedrock/` — AWS Bedrock client wrapper
- `src/app/admin/case/[id]/actions.ts` — add extraction action
- `src/app/admin/case/[id]/page.tsx` — add "Extract Data" button on documents

**Acceptance:** Admin uploads landlord itemization → clicks "Extract" → sees structured deduction list → confirms or edits.

---

### 7. Print-and-Mail API Integration (Lob)
**Status:** Letters generated digitally; tenant prints and mails manually.

**What to build:**
- Lob API integration for certified mail
- Admin action: "Mail this letter" → generates PDF, sends to Lob, marks as mailed
- Track mailing status (sent, delivered, failed)
- Record tracking number on case
- Tenant costs billed to tenant (Tribune covers upfront, bills tenant later)

**Dependencies:** Requires #4 (PDF export)

**Files:**
- `src/lib/lob/` — Lob client wrapper
- `src/app/admin/case/[id]/actions.ts` — add mail letter action
- New table: `case_mailings` (id, case_id, letter_id, tracking_number, status, sent_at, delivered_at, cost_cents)

**Acceptance:** Admin posts letter → clicks "Mail via Lob" → letter sent certified mail → tracking number recorded.

---

### 8. AI-Drafted Letters via Claude (Bedrock)
**Status:** Letter templates are static; could be dynamically generated.

**What to build:**
- Server action: `draftLetter(caseId, letterNumber)` using Claude via Bedrock
- Takes case data (tenant, landlord, deposit, lease dates, deductions)
- Generates custom letter based on case specifics
- Admin reviews and edits before posting (never auto-send)
- Uses $10k AWS Bedrock credits

**Files:**
- `src/lib/bedrock/draft-letter.ts`
- `src/app/admin/case/[id]/actions.ts` — add draft action
- `src/app/admin/case/[id]/page.tsx` — "Draft Letter with AI" button

**Acceptance:** Admin clicks "Draft Letter 2 with AI" → Claude generates custom letter → admin reviews → edits → posts.

---

### 9. Per-Case Inbound Email (AgentMail or SendGrid)
**Status:** Landlord responses manually submitted by tenant.

**What to build:**
- Per-case email address (e.g., `case-{uuid}@tribune.xyz`)
- Email forwarding service (AgentMail or SendGrid Inbound Parse)
- Incoming emails from landlord → parsed → added to case timeline automatically
- Tenant gets notification: "Landlord responded to your case"

**Files:**
- `src/app/api/webhooks/inbound-email/route.ts` — webhook handler
- `src/lib/email/parse-inbound.ts` — email parsing logic
- New table: `case_inbound_emails` (id, case_id, from, subject, body, received_at)

**Acceptance:** Landlord replies to `case-xyz@tribune.xyz` → email appears on case timeline → tenant notified.

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
