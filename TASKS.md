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
- [x] `sessionStorage` bridge carrying intake data across magic link redirect
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
- [x] `CLAUDE.md` with project context
- [x] Repo pushed to GitHub (`magnus-em/tribune`, private)

## Partial or Unclear

- **`current_letter_number` update logic** — updated in two places (`changeStatus` and `postLetter`) with inconsistent rules. Needs a single source of truth. See ARCHITECTURE.md §Tech Debt.
- **Letter posting** — admin can post letters, but there is no generation, no template, no placeholder interpolation. Everything is paste-in-textarea. Functionally works; strategically incomplete.
- **Status flow** — all status transitions are manual and unconstrained. There's no workflow, no auto-transition on actions, no invalid-transition guard.
- **Intake resilience** — `sessionStorage` bridge loses data if the magic link is opened on a different device or session. No recovery flow. See ARCHITECTURE.md §Risks.
- **Deadlines** — calculated and displayed, but no alerting, no reminder, no automatic escalation when a case passes its deadline.
- **Types from DB** — hand-maintained `src/lib/types/database.ts`. No codegen. Will drift.
- **Tests** — none.
- **README** — still the Next.js default.
- **Legal review pipeline** — no second pair of eyes on letter content before it's posted to a tenant.

## Next 10 Highest-Leverage Tasks

Ordered by my best guess at leverage. To be reviewed next session — user has flagged that MVP priority will be revisited.

1. **Letter template system.** `src/lib/letters/` module with CT § 47a-21-grounded templates, case-data interpolation, and a double-damages calculator. Pure functions, no UI yet.
2. **Admin "Generate letter from template" UI** wired to #1. Admin picks a template, previews, edits, posts. Replaces the blank-textarea flow.
3. **Fix `current_letter_number` inconsistency.** Single source of truth; probably increment only on letter post, never on status change.
4. **Move case creation server-side.** Replace `sessionStorage` bridge with a server action or route handler. Removes the cross-device failure mode.
5. **Supabase type codegen.** Run `supabase gen types typescript` and replace hand-written types.
6. **Minimal test harness.** Playwright for intake + auth callback + dashboard happy path. Vitest for deadline and damages math.
7. **PDF export of letters.** Tenant-downloadable, printable, and the groundwork for automated mail delivery.
8. **Deadline cron.** Daily job flagging cases at risk. Supabase Scheduled Functions or Vercel Cron.
9. **Tenant email notifications via Resend.** Letter ready, status changed, deadline approaching.
10. **File uploads via Supabase Storage.** Lease PDFs, landlord response scans, evidence photos. New `case_documents` table.

## Explicitly Deferred

These are known gaps deliberately pushed beyond the immediate queue.
- Payments / invoicing / Stripe.
- Multi-jurisdiction (non-CT) support.
- Admin analytics dashboard.
- SMS notifications.
- Print-and-mail API for automated letter delivery (depends on #7, #1).
- Self-serve admin user management.
