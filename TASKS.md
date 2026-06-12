# Tribune — Tasks

Tracks what's built, what's in progress, and what's next. Updated 2026-06-11.

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
- [x] Outbound wrapper rewritten to **agent / pro-se** framing (NOT "our client"). Tribune = authorized communications agent; demand body stays the tenant's first-person voice, signed by tenant. Establishes agency, avoids attorney "our client" language. Verify with CT counsel before scaling. (Letter *body* in `src/lib/letters/templates.ts` left as-is for human/legal review.)

### Phase 3 — Admin dispatch flow ✓
- [x] `postLetterWithNotification` → "Save Draft" → `correspondence_ready`
- [x] `dispatchLetter(caseId, messageId, channel)` → sends Resend email, sets `awaiting_landlord`, notifies tenant
- [x] `AdminWritePanel` updated: staged-letter banner with "Send via Email", "Save Draft" button
- [x] `AdminActionBanner` updated for `correspondence_ready`
- [x] `logLandlordReply` action + "Log Reply" tab in admin write panel
- [x] `adminReportRecovery` server action + "Resolve" tab in admin write panel

### Phase 4 — Inbound email webhook ✓
- [x] `src/app/api/webhooks/resend/inbound/route.ts` — REWRITTEN for Resend's real `email.received` format: Svix signature verification, fetches body via `resend.emails.receiving.get()` (webhook payload is metadata-only), logs landlord reply, sets `landlord_responded`, emails admin with deep link
- [x] Webhook writes via **service-role client** (`createServiceClient()` in `src/lib/supabase/server.ts`) — runs without a user session, so bypasses RLS. Narrow scope: only logs landlord_reply + status flip.
- [ ] Configure Resend inbound MX records for `inbound.usetribune.org` (DNS — see Pending Ops)
- [ ] Add `ADMIN_EMAIL`, `RESEND_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` env vars to Vercel

### Phase 6 — Tenant landlord-intro step ✓
- [x] Tenant sends one introductory email from their own inbox (mailto + copy) announcing Tribune as authorized rep — primes landlord + establishes tenant-originated agency record
- [x] `LandlordIntroStep` component + `buildIntroEmail()` in `_components.tsx`, shown during setup statuses
- [x] `markLandlordIntroSent()` server action logs a system message (marker `INTRO_SENT_TITLE` in constants); visible in tenant + admin timeline. No schema migration.

### Phase 5 — Tenant UI cleanup ✓
- [x] Removed `SendLetterBanner`, `LandlordResponseForm`, reply branch of `LandlordNextStep`
- [x] Removed `confirmLetterSent`, `submitLandlordResponse` server actions
- [x] New `RecoveryStep` component (recovery reporting only)
- [x] `ActionBanner` updated for `correspondence_ready` and `awaiting_landlord`

## Launch — DECISIONS & CONFIG

**Inbound landlord replies (decided):** DNS is on Cloudflare; MX = Cloudflare Email Routing
(`route1/2/3.mx.cloudflare.net`) already forwards `*@usetribune.org` → Magnus's Gmail.
- For launch: reply-to = `case+{id}@usetribune.org` (code updated) → replies land in Gmail →
  Magnus logs them manually via admin "Log Reply" tab. $0, no new infra, Gmail untouched.
- Auto-logging webhook (`/api/webhooks/resend/inbound`) is BUILT but parked as a fast-follow.
  To activate later, pick ONE: (a) Cloudflare Email Worker → POST our endpoint (free), or
  (b) Resend Pro upgrade + `inbound.usetribune.org` subdomain (~$20/mo, uses webhook as-is +
  `RESEND_WEBHOOK_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAIL`).

**Sending:** verified working — `usetribune.org` sending enabled, test send succeeded with the
key in `.env.local`. Prod "no emails sent" = `RESEND_API_KEY` missing in Vercel.

### LAUNCH BLOCKERS (config; Magnus)
- [ ] Vercel prod env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=hello@usetribune.org` (← fixes "no emails sent")
- [ ] Vercel prod env: `NEXT_PUBLIC_SITE_URL` (prod domain), `NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE`
- [ ] Vercel prod env (optional): `XAI_API_KEY` (lease auto-extraction; intake works without it)
- [ ] Supabase: add prod domain to OAuth redirect URL allowlist
- [ ] Set `is_admin = true` on Magnus's profile in **prod** DB
- [ ] Confirm Cloudflare has a **catch-all → Gmail** route (so `case+{id}@` replies forward)
- [ ] Deploy current code (reply-to fix, intro step, wrapper rewrite)

### Legal
- [ ] Have CT counsel review the agent-framing wrapper + letter body before scaling beyond MVP

## Done — Direct Correspondence polish
- [x] Fixed broken sentence + unused `propertyAddress` in landlord-letter email wrapper

## Done — Intake review experience (2026-06-03)
- [x] **Voice & brand rule** codified — Tribune is the actor in all tenant-facing copy; never "Magnus", "the admin", operator-scale "we". Short rule in CLAUDE.md, full guide in PRODUCT_BRIEF.md.
- [x] **Post-submit confirmation** — tenant case banner promises a response "within a few hours"; transactional email goes out on intake submit via `renderCaseSubmittedEmail` (best-effort, never blocks).
- [x] **Statutory deadline urgency in intake** — once `move_out_date` is entered in step 2, a banner shows the CT § 47a-21 deadline date, days remaining, and a "mail by" recommendation (3 days before). Past-deadline cases get a double-damages framing instead.
- [x] **Declined-case flow** — new `declined` enum value + `decline_reason` (admin-only) + `decline_message` (tenant-visible) columns. Admin gets a Decline dialog; tenant case page surfaces a Tribune-voiced banner + free CT resources (NHLAA, CT Fair Housing, § 47a-21 statute). Email template `renderCaseDeclinedEmail`. Migration: [supabase/migrations/20260603_declined_case_flow.sql](supabase/migrations/20260603_declined_case_flow.sql) (already applied to remote).
- [x] **Test data wipe** — all non-admin auth users, cases, messages, actions, documents, invoices, and storage objects cleared. Admin profile (`melbournemagnus@gmail.com`) preserved.

## Dead Code — Delete
- [x] `src/app/v1/` through `src/app/v5/` — landing page design iterations, deleted

## E2E Audit — 2026-06-11
Full tenant + admin flow audit (static + live click-through + RLS simulation).
Findings and fixes in [AUDIT_FINDINGS_2026-06-11.md](AUDIT_FINDINGS_2026-06-11.md).
- [x] **Letter date off-by-one** (legal) — `new Date("YYYY-MM-DD")` parsed as UTC, rendered a day early in letters/UI. Added `parseDateOnly()` and applied everywhere.
- [x] **Tenant recovery silently RLS-denied** — no tenant UPDATE policy on `cases`; recovery created an invoice but never resolved the case. Migration [20260611](supabase/migrations/20260611_tenant_recovery_and_message_guard.sql) (applied).
- [x] **Tenant could forge tribune_letter/landlord_reply messages** — restricted tenant `case_messages` insert to `message_type='system'` (same migration).
- [x] **Server intake validation skipped cross-field checks** — zod v4 `.merge()` dropped `superRefine`; rebuilt `intakeSchema` as one object.
- [x] **Inbound webhook** — guarded missing Resend key (was 500ing), fail-closed signature check in prod, escaped landlord HTML in admin email.
- [x] **Admin assessment** — exposure now `amount_withheld*2` (matches letters); photo check includes `photo_move_in`/`photo_move_out`.
- [x] **Misc** — dropped `amount_cents` from `recovery_reported` analytics (PII), added recovery amount validation + duplicate-invoice guard, removed noisy admin-check console logs.
- [ ] **Manual:** delete orphaned E2E storage object `case-documents/f75ab011-…/*.pdf` from Supabase dashboard.
- [ ] **Verify:** `RESEND_WEBHOOK_SECRET` is set in Vercel prod env (webhook now fails closed without it).

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

