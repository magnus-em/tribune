# Tribune — Setup Status & Next Steps

Generated: 2026-04-15

## What's Been Built (Code Complete)

### Core Infrastructure ✅
- Server-side intake with `pending_cases` table (cross-device magic link support)
- Document upload system with Supabase Storage
- Transactional email with Resend
- Letter templates (CT § 47a-21, Letters 1-3)
- Legal disclaimers on all surfaces
- Error tracking with Sentry (PII filtering)
- Timeline visualization
- Centralized business constants
- Jest test suite (17+ tests)
- Supabase generated types

### What Works Right Now
- Tenant can complete intake → receive magic link → create case
- Tenant can upload documents (lease, correspondence, photos, etc.)
- Admin can view all cases and documents
- Admin can post updates → tenant receives email
- Letter templates exist with proper CT statute citations
- Error boundaries catch and report issues to Sentry

---

## Manual Setup Required

You mentioned some things needed manual setup. Here's what likely needs to be done:

### 🔴 CRITICAL - Database Migration

**Status:** Migration file exists but may not be applied to production DB

**Action needed:**
```bash
# Run this migration against your Supabase project:
supabase/migrations/20260414_first_slice.sql
```

**What it does:**
- Creates `pending_cases` table
- Creates `case_documents` table
- Creates `document_kind` enum
- Adds new `case_status` values: `awaiting_tenant`, `in_collections`, `dead`
- Adds resolution tracking fields to `cases`: `amount_recovered_cents`, `fee_collected_cents`, `tenant_costs_cents`, `resolved_at`, `resolution_notes`
- Creates Storage bucket `case-documents` with RLS policies
- Updates default contingency from 15% → 10%

**How to apply:**
1. Option A (Supabase CLI):
   ```bash
   supabase db push
   ```

2. Option B (Supabase Dashboard):
   - Go to SQL Editor in your Supabase project
   - Copy/paste contents of `supabase/migrations/20260414_first_slice.sql`
   - Run it

**How to verify it worked:**
- Check that `pending_cases` table exists
- Check that `case_documents` table exists
- Check that Storage bucket `case-documents` exists
- Try uploading a document through the UI

---

### 🟡 IMPORTANT - External Service Setup

#### Resend (Email)
**Status:** ✅ You said test emails worked, so this is configured!

**Already done:**
- RESEND_API_KEY in Vercel env
- RESEND_FROM_EMAIL in Vercel env

**Recommended next steps:**
- Set up custom domain for sending (e.g., `hello@tribune.xyz` instead of Resend's default)
- Configure DNS records (SPF, DKIM, DMARC) for deliverability
- Set up reply-to address

#### Sentry (Error Tracking)
**Status:** 🟡 Optional but recommended

**Code ready:** Yes - PII filtering configured, only needs DSN

**To enable:**
1. Create Sentry project at https://sentry.io
2. Get your DSN from Project Settings
3. Add to Vercel env:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
   SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
   ```

**Benefits:**
- Real-time error alerts
- Stack traces with source maps
- Session replay for debugging
- PII is automatically filtered

**Can skip for now:** Yes - errors just won't be reported to Sentry

---

### 🟢 OPTIONAL - Future Services

These aren't needed yet but will be when features land:

#### PostHog (Product Analytics)
- **Status:** Not yet integrated
- **When needed:** When you want usage analytics
- **Blocked by:** Nothing - just not prioritized yet

#### AWS Bedrock (Claude AI)
- **Status:** Not yet integrated
- **When needed:** For AI document extraction & letter drafting
- **Already have:** $10k AWS credits

#### Lob (Print & Mail)
- **Status:** Not yet integrated
- **When needed:** Automated letter mailing
- **Depends on:** PDF export feature

---

## What's Next: Development Priorities

Based on TASKS.md, here's the recommended order:

### 1. Admin "Generate Letter from Template" UI
**Why first:** Letter templates exist with proper CT § 47a-21 content but admin still pastes text manually. This unlocks the biggest value from the work already done.

**Scope:**
- Add "Generate Letter" button to admin case detail
- Modal to select template (1, 2, or 3)
- Preview pane with case data filled in
- Edit pane for admin to modify before posting
- Post to case_messages

**Estimated complexity:** Medium (1-2 sessions)

**Blockers:** None

---

### 2. Expand Email Triggers
**Why second:** Email infrastructure works; adding more triggers is straightforward and high-value for UX.

**Scope:**
Add emails for:
- Letter posted (tenant notified when admin posts demand letter)
- Letter mailed (confirmation when admin marks as sent)
- Landlord response logged
- Case resolved
- Collections initiated

**Estimated complexity:** Small (1 session)

**Blockers:** None

---

### 3. Deadline Alert Cron
**Why third:** Deadlines are critical legally; automated alerts prevent missed statutes of limitation.

**Scope:**
- Vercel Cron endpoint at `/api/cron/check-deadlines`
- Runs daily at 9 AM ET
- Finds cases with `statutory_deadline` within 7 days
- Sends admin email with approaching deadlines
- Optional: tenant reminder at 3 days

**Estimated complexity:** Small (1 session)

**Blockers:** None

---

### 4. E2E Test Suite (Playwright)
**Why fourth:** Good foundation of unit tests exists; E2E tests lock in the happy path before scaling features.

**Scope:**
- Playwright setup
- Test: intake → auth → dashboard
- Test: upload document → admin sees it
- Test: admin posts update → tenant receives email

**Estimated complexity:** Medium (1-2 sessions)

**Blockers:** None

---

### 5. PDF Export of Letters
**Why fifth:** Groundwork for automated mailing; tenant download is nice-to-have.

**Scope:**
- Choose PDF library (`@react-pdf/renderer` or `puppeteer`)
- API route to generate PDF from letter content
- "Download Letter as PDF" button
- Proper formatting with Tribune branding

**Estimated complexity:** Medium (1-2 sessions)

**Blockers:** None

---

### Later (Post-MVP)

These are valuable but not critical path:

6. **Document Content Extraction (Claude/Bedrock)** - AI extracts deductions from landlord letters
7. **Print & Mail API (Lob)** - Automated certified mail delivery
8. **AI Letter Drafting (Claude/Bedrock)** - Generate custom letters per case
9. **Per-Case Inbound Email** - Landlord replies land on case timeline

---

## Quick Wins vs. Longer Projects

### Quick Wins (1 session each)
- Expand email triggers
- Deadline cron
- Update README

### Medium Projects (1-2 sessions)
- Letter template UI integration
- E2E test suite
- PDF export

### Longer Projects (3+ sessions)
- AI document extraction
- Print & mail API
- AI letter drafting
- Per-case inbound email

---

## Immediate Action Items

**Before next dev work:**

1. ✅ Verify database migration applied:
   - Check `pending_cases` table exists
   - Check `case_documents` table exists
   - Check Storage bucket `case-documents` exists

2. 🟡 Optionally set up Sentry:
   - Create project at sentry.io
   - Add DSN to Vercel env

3. 🟢 Choose next feature to build:
   - Recommend starting with "Generate Letter from Template" UI
   - Highest value, unlocks existing work

**To verify everything works:**
1. Complete an intake flow end-to-end
2. Upload a document
3. Admin posts an update
4. Verify tenant receives email
5. Check Sentry for any errors (if configured)

---

## Questions to Resolve

1. **Domain for email:** Do you have `tribune.xyz` (or similar) registered? Need to configure Resend sending domain.

2. **Supabase project:** Are you using a free tier or paid? Storage limits may affect document uploads at scale.

3. **Vercel deployment:** Is the app deployed to Vercel yet, or just local dev?

4. **Admin user:** Is there a profile with `is_admin = true` in the database? Need this to access `/admin/*`.

5. **Test data:** Do you want me to help generate test cases/documents for development?

---

## Summary

**Code status:** First vertical slice complete + letter templates + tests + Sentry + timeline

**Manual setup needed:**
- 🔴 Run database migration (critical)
- 🟡 Set up Sentry DSN (optional but recommended)
- 🟢 Configure custom email domain (future)

**Recommended next step:** Build "Generate Letter from Template" UI - unlocks the letter templates that already exist with proper CT § 47a-21 content.

**Estimated time to MVP-ready:** 3-5 dev sessions if we focus on:
1. Letter template UI
2. Email triggers
3. Deadline cron
4. Basic E2E tests
