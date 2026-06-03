# Tribune — Tasks

Tracks what's built, what's in progress, and what's next. Updated 2026-06-02.

## Done

**Auth & Onboarding**
- [x] Google OAuth + email/password on unified `/login` page
- [x] Auth callback (`/auth/callback`) — exchanges code for session
- [x] Sign-out route (`/auth/signout`)
- [x] Middleware protecting `/dashboard/*` (auth) and `/admin/*` (auth + `is_admin`)
- [x] Trigger auto-creating `profiles` row on signup
- [x] `is_admin()` SECURITY DEFINER function to fix RLS recursion
- [x] Login page respects `?next=` param — redirects post-auth to intended destination
- [x] Already-authed users skip login form and go straight to `next`
- [x] Supabase redirect URL allowlist updated with `http://localhost:3000/**` for dev

**Intake (Authenticated)**
- [x] 4-step intake form at `/dashboard/new-case` (inside app shell, requires auth)
- [x] Manual Zod validation per step + cross-field validation on submit
- [x] Writes directly to `cases` table via server action (no more `pending_cases` pipeline)
- [x] Statutory deadline calculation using `STATUTE_DAYS = 21` (CT § 47a-21)
- [x] Profile upsert on case creation
- [x] Service agreement (step 4) — 15% contingency, 7-day payment due, 1.5%/month late fee, 30-day collections/credit reporting/civil proceedings clause; irrevocable independent verification authorization
- [x] Landlord email OR phone required (cross-field validation)
- [x] Redirects to case detail page on submit (not dashboard list)
- [x] Upload failures surfaced to tenant as toast warnings (previously silent)

**App Shell**
- [x] Collapsible sidebar (shadcn sidebar component, Tailwind v3 compatible)
- [x] Frosted-glass topbar with breadcrumbs
- [x] Role-based nav (tenant: Dashboard, New Case; admin: All Cases)
- [x] User dropdown with sign out in sidebar footer
- [x] Mobile responsive — sidebar collapses to sheet on mobile
- [x] Sidebar case card — status dot, deadline urgency, estimated net recovery
- [x] Dashboard layout streams immediately — only blocks on `getUser()`, sidebar data loads in Suspense (sidebar shows skeleton until ready)
- [x] Navigation progress bar — thin top bar fires on any internal link click

**Tenant Dashboard**
- [x] Case list with status badges, metrics, action prompts (`/dashboard`)
- [x] Stat cards (active, resolved, total at stake)
- [x] Empty state with conversion CTA
- [x] Case detail rebuilt as guided dispute workflow (`/dashboard/case/[id]`):
  - Stage rail → per-status action banner → rounds (grouped by letter) → evidence center → recovery module
  - Event stream synthesis + round grouping in `_components.tsx` — rounds derived from letter timestamps
  - StageRail, ClaimSummary, CaseReadiness, CurrentRoundBox, ActionBanner, EvidenceCenter, LandlordResponseForm, RecoveryForm
- [x] Upload documents with kind selection (categorized: lease, photos, landlord correspondence, deduction itemization)
- [x] Submit landlord response
- [x] Confirm letter sent → updates `cases.status` to `awaiting_landlord`
- [x] Report recovery → updates `deposit_returned_cents`, resolves case, creates invoice, sends invoice email
- [x] Send-letter UX — `SendLetterBanner` at `letter_ready`: collapsible letter preview, copies letter + opens `mailto:` with subject pre-filled, confirm-sent button starts 21-day clock
- [x] `LandlordNextStep` shown for `awaiting_landlord`, `letter_sent`, and `landlord_responded` (was missing from last status)
- [x] Case page state machine fixed — no duplicate banners, `RecoveryForm` always shows resolved card on terminal status, Claim/Readiness hidden on resolved/closed, unpaid invoice surfaced above fold
- [x] Invoice panel — invoice number, amount, due date, Venmo/Zelle instructions with one-click copy of invoice number

**Admin Dashboard**
- [x] DataTable with sorting, filtering, search, pagination (`@tanstack/react-table`)
- [x] Stat cards (total, active, needs attention, overdue, total withheld)
- [x] Admin case detail rebuilt with lifecycle philosophy (`/admin/case/[id]`):
  - Per-status `AdminActionBanner` — tells admin exactly what to do next
  - `ContactsPanel` — tenant + landlord contact info
  - `CaseAssessmentPanel` — statutory exposure (2× deposit), deadline urgency, readiness checklist
  - `AdminWritePanel` — 3 tabs (Letter / Update / Note) with "Generate from template" wired to `generateDemandLetter()`
  - `AdminRoundGroup` — all messages including admin-only notes (yellow dashed)
  - Landlord reply spotlight — orange-bordered box when `status === landlord_responded`
  - Inline status change with audit log
- [x] Email notification on letter post and update post (via Resend)
- [x] Admin invoice panel — invoice status, mark-paid form (Venmo/Zelle/Stripe/waived + reference field)

**Landing Page**
- [x] CT § 47a-21 explained (21-day rule, double damages, unlawful deductions, interest)
- [x] Landlord tactics section (fabricated deductions, delay, intimidation)
- [x] Adaptive system positioning (not template letters)
- [x] FAQ, bottom CTA
- [x] Auth-aware nav — Dashboard button when logged in, Sign in + Start Your Case when logged out
- [x] Both hero CTAs gate on auth state (direct to new-case if authed, login?next= if not)
- [x] All copy updated to 15% contingency

**Database**
- [x] `profiles`, `cases`, `case_messages`, `case_actions`, `case_documents` tables
- [x] Enums: `case_status`, `message_type`, `action_type`, `document_kind`
- [x] RLS policies for tenant + admin access
- [x] `is_admin()` function (SECURITY DEFINER) to prevent RLS recursion
- [x] Supabase Storage bucket `case-documents` with RLS
- [x] `invoices` table — status (pending/paid/overdue/collections/waived), Stripe intent scaffold
- [x] `invoice_number_seq` + `next_invoice_number()` (SECURITY DEFINER) — generates `TRB-YYYY-NNNN`
- [x] `contingency_pct` default updated to 15%; all existing cases backfilled

**Infrastructure**
- [x] Next.js 15, React 19, Tailwind v3, shadcn/ui
- [x] Deployed on Vercel (auto-deploy from `main`)
- [x] Sentry error tracking — PII scrubbing, tunnel route, source maps, session replay
- [x] PostHog analytics — pageviews, signup/login/signout, intake steps, case events
- [x] Resend transactional email — case update + invoice notifications
- [x] Letter templates (CT § 47a-21, Letters 1–3) with placeholder interpolation
- [x] Invoice email template — formal HTML invoice with Venmo/Zelle payment instructions
- [x] Jest test suite (17+ tests)
- [x] Centralized constants (`STATUTE_DAYS = 21`, `CONTINGENCY_PCT = 15`, `PAYMENT_DUE_DAYS = 7`)
- [x] `NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE` env var (Vercel + local)

## Next Up — Direct Correspondence Feature

Tribune handles all landlord negotiation directly. Tenants no longer send letters; Tribune dispatches via email (and later SMS/mail). Landlord replies auto-log via inbound email webhook. Either party can report recovery.

### Phase 1 — Schema migration ✓
- [x] Migration: rename `letter_ready` → `correspondence_ready`, add `landlord_reply` message type, `letter_dispatched` action type, `dispatch_channel` enum + columns on `case_messages`
- [x] Update all TS/TSX references from `letter_ready` → `correspondence_ready`
- [x] Deprecate `letter_sent` status in UI logic (enum value left intact)

### Phase 2 — Landlord letter email template ✓
- [x] `renderLandlordLetterEmail()` in `src/lib/email/templates/landlord-letter.ts`
- [x] `sendEmail` updated to support `replyTo` param
- [ ] Update letter template voice (`src/lib/letters/templates.ts`) to "our client" framing — flag for legal review before any real sends

### Phase 3 — Admin dispatch flow ✓
- [x] `postLetterWithNotification` → "Save Draft" → `correspondence_ready`
- [x] `dispatchLetter(caseId, messageId, channel)` → sends Resend email, sets `awaiting_landlord`, notifies tenant
- [x] `AdminWritePanel` updated: staged-letter banner with "Send via Email", "Save Draft" button
- [x] `AdminActionBanner` updated for `correspondence_ready`
- [x] `logLandlordReply` action + "Log Reply" tab in admin write panel
- [x] `adminReportRecovery` server action + "Resolve" tab in admin write panel

### Phase 4 — Inbound email webhook ✓
- [x] `src/app/api/webhooks/resend/inbound/route.ts` — parses `case+{caseId}@inbound.usetribune.org`, logs landlord reply, sets `landlord_responded`, notifies admin
- [ ] Configure Resend inbound MX records for `inbound.usetribune.org` (DNS step — do when ready to go live)
- [ ] Add `ADMIN_EMAIL` env var to Vercel

### Phase 5 — Tenant UI cleanup ✓
- [x] Removed `SendLetterBanner`, `LandlordResponseForm`, reply branch of `LandlordNextStep`
- [x] Removed `confirmLetterSent`, `submitLandlordResponse` server actions
- [x] New `RecoveryStep` component (recovery reporting only)
- [x] `ActionBanner` updated for `correspondence_ready` and `awaiting_landlord`

## Pending Ops / Config
- [ ] Add `ADMIN_EMAIL` env var to Vercel (inbound webhook currently falls back to hardcoded `hello@usetribune.org`)
- [ ] Configure Resend inbound MX records for `inbound.usetribune.org` (do when ready to go live)
- [ ] Update letter template voice (`src/lib/letters/templates.ts`) to "our client" framing — legal review required before any real sends

## Dead Code — Delete
- [x] `src/app/v1/` through `src/app/v5/` — landing page design iterations, deleted

## Next Up

### Admin "Generate from template" UI
Letter templates exist in `src/lib/letters/templates.ts` with CT § 47a-21 content and full placeholder interpolation. Admin currently types into blank textarea. Wire template selection + preview into `AdminWritePanel`.
- [ ] Template picker (Letter 1 / 2 / 3 dropdown)
- [ ] Preview with case data substituted
- [ ] "Use this draft" → populate textarea for editing before post

### Payments — Stripe invoice collection
`invoices` table and invoice email exist. Tenants currently get Venmo/Zelle copy-paste. Stripe payment intent column is scaffolded on `invoices`.
- [ ] Stripe account + webhook setup
- [ ] Payment intent creation on invoice insert
- [ ] Tenant payment page `/dashboard/invoice/[id]`
- [ ] Webhook: mark invoice paid on `payment_intent.succeeded`
- [ ] Admin can still mark paid manually (Venmo/Zelle/waived) — keep existing flow

### Deadline cron
No alerts today. Cases can silently blow past their CT § 47a-21 deadline.
- [ ] Daily cron (Vercel Cron or Supabase Scheduled Functions) — flag cases where `statutory_deadline < now + 3 days` and status is not terminal
- [ ] Admin notification email / dashboard badge
- [ ] `awaiting_tenant` status for cases where Tribune needs tenant action

