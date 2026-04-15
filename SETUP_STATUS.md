# Tribune — Setup Status

Updated: 2026-04-15

## Production Services (All Live)

| Service | Status | Notes |
|---------|--------|-------|
| Vercel | Live | Auto-deploys from `main` |
| Supabase | Live | Postgres + Auth + Storage + RLS |
| Google OAuth | Live | Configured in Supabase + GCP |
| Resend | Live | `RESEND_API_KEY` in Vercel env |
| Sentry | Live | DSN hardcoded, auth token in Vercel env, tunnel route `/monitoring` |
| PostHog | Live | Keys in Vercel env, PII scrubbing enabled |

## Environment Variables (Vercel)

All configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## Database

Migration `20260414_first_slice.sql` should be applied. Verify by checking these exist in Supabase:
- Tables: `profiles`, `cases`, `case_messages`, `case_actions`, `case_documents`, `pending_cases`
- Storage bucket: `case-documents`
- Function: `is_admin()` (SECURITY DEFINER — fixes RLS recursion)

## Not Yet Configured

- Custom email domain (using Resend default — configure SPF/DKIM/DMARC for `usetribune.org` when ready)
- AWS Bedrock ($10k credits claimed, not integrated — needed for AI features)
- Lob print-and-mail (deferred)
