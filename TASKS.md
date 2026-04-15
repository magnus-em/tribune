# Tribune — Tasks

Tracks what's built, what's in progress, and what's next. Updated 2026-04-15.

## Done

**Auth & Onboarding**
- [x] Google OAuth + email/password on unified `/login` page
- [x] Auth callback (`/auth/callback`) — exchanges code for session
- [x] Sign-out route (`/auth/signout`)
- [x] Middleware protecting `/dashboard/*` (auth) and `/admin/*` (auth + `is_admin`)
- [x] Trigger auto-creating `profiles` row on signup
- [x] `is_admin()` SECURITY DEFINER function to fix RLS recursion

**Intake (Authenticated)**
- [x] 4-step intake form at `/dashboard/new-case` (inside app shell, requires auth)
- [x] Manual Zod validation per step + cross-field validation on submit
- [x] Writes directly to `cases` table via server action (no more `pending_cases` pipeline)
- [x] Statutory deadline calculation using `STATUTE_DAYS = 21` (CT § 47a-21)
- [x] Profile upsert on case creation

**App Shell**
- [x] Collapsible sidebar (shadcn sidebar component, Tailwind v3 compatible)
- [x] Frosted-glass topbar with breadcrumbs
- [x] Role-based nav (tenant: Dashboard, New Case; admin: All Cases)
- [x] User dropdown with sign out in sidebar footer
- [x] Mobile responsive — sidebar collapses to sheet on mobile

**Tenant Dashboard**
- [x] Case list with status badges, metrics, action prompts (`/dashboard`)
- [x] Stat cards (active, resolved, total at stake)
- [x] Case detail (`/dashboard/case/[id]`) — metric boxes, documents, thread, actions
- [x] Upload documents with kind selection
- [x] Submit landlord response
- [x] Confirm letter sent
- [x] Empty state with conversion CTA

**Admin Dashboard**
- [x] DataTable with sorting, filtering, search, pagination (`@tanstack/react-table`)
- [x] Stat cards (total, active, needs attention, overdue, total withheld)
- [x] Admin case detail (`/admin/case/[id]`) — extracted sub-components
- [x] Tabbed interface: Thread, Docs, Letter, Note, Actions
- [x] Status change, post letter, post update, add note (internal or visible)
- [x] Email notification on letter post and update post (via Resend)

**Landing Page**
- [x] CT § 47a-21 explained (21-day rule, double damages, unlawful deductions, interest)
- [x] Landlord tactics section (fabricated deductions, delay, intimidation)
- [x] Adaptive system positioning (not template letters)
- [x] FAQ, bottom CTA
- [x] All CTAs route to `/login`

**Database**
- [x] `profiles`, `cases`, `case_messages`, `case_actions`, `case_documents` tables
- [x] Enums: `case_status`, `message_type`, `action_type`, `document_kind`
- [x] RLS policies for tenant + admin access
- [x] `is_admin()` function (SECURITY DEFINER) to prevent RLS recursion
- [x] Supabase Storage bucket `case-documents` with RLS

**Infrastructure**
- [x] Next.js 15, React 19, Tailwind v3, shadcn/ui
- [x] Deployed on Vercel (auto-deploy from `main`)
- [x] Sentry error tracking — PII scrubbing, tunnel route, source maps, session replay
- [x] PostHog analytics — pageviews, signup/login/signout, intake steps, case events
- [x] Resend transactional email — case update notifications
- [x] Letter templates (CT § 47a-21, Letters 1–3) with placeholder interpolation
- [x] Jest test suite (17+ tests)
- [x] Centralized constants (`STATUTE_DAYS = 21`, `CONTINGENCY_PCT = 10`)

## Next Up

### 1. Small Claims Court Guidance Flow
Promised on the landing page. Step-by-step walkthrough for CT small claims: what forms to file, filing fees, court locations, what to bring, what to expect. Static content pages inside the dashboard.

### 2. Expand Email Triggers
Currently emails fire on case updates only. Add: letter posted notification, landlord response confirmation, case resolved summary. Templates exist — just need triggers wired.

### 3. Deadline Alert Cron
Vercel Cron at `/api/cron/check-deadlines`. Daily check for cases approaching statutory deadline. Email admin + optionally tenant.

### 4. PDF Export of Letters
"Download as PDF" button on letters. Needed for print-and-mail and tenant records. Consider `@react-pdf/renderer`.

### 5. Admin "Generate Letter from Template" UI
Templates exist in `src/lib/letters/templates.ts`. Build a "Generate" button that picks template, previews with case data interpolated, allows editing before posting.

## Deferred

- Payments / invoicing / Stripe
- Collections integration
- Multi-jurisdiction (non-CT)
- AI letter drafting (Claude/Bedrock)
- AI document extraction (Claude/Bedrock)
- Print-and-mail API (Lob)
- Per-case inbound email
- E2E tests (Playwright)
- SMS notifications
- Admin analytics dashboard
