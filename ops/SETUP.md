# Magnus's Setup

Everything here needs a human: accounts, credentials, or decisions the agent may
not make. All of it is free. Check items off in place; the next tick picks up
whatever is done. **Never paste secret values into this file or any committed file.**

## Part A — minimum before the first real case (~20 min)

Without these, letters and notifications don't send in production.

- [ ] **Restore the Supabase project (do this first; nothing works without it).**
      Supabase → project `tribune` → **Restore project**. Found paused on
      2026-10-31: free projects pause after a week without traffic, and while
      paused nobody can sign in. The daily `/api/health` cron keeps it awake from
      now on and emails `ADMIN_EMAIL` if it goes down again.
- [ ] **Google sign-in:** Google Cloud console → APIs & Services → OAuth consent
      screen → publishing status **In production**. While it says "Testing",
      only the listed test users can sign in with Google. Email, profile, and
      openid scopes don't need Google's verification review.
- [ ] **Sign-up emails:** Supabase → Auth → SMTP settings → custom SMTP with
      Resend (host `smtp.resend.com`, port 465, user `resend`, password = the
      Resend API key, sender `hello@usetribune.org`). Supabase's built-in sender
      only delivers to your own team's addresses, so confirmation emails never
      reach a real tenant. Free on Resend's free tier.
- [ ] Run `vercel login` locally (the CLI token expired).
- [ ] Vercel → tribune → Settings → Environment Variables (Production):
  - `RESEND_API_KEY` (the key in `.env.local` works; it's verified)
  - `RESEND_FROM_EMAIL` = `hello@usetribune.org`
  - `NEXT_PUBLIC_SITE_URL` = `https://usetribune.org`
  - `NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE` (for the Venmo/Zelle invoice instructions)
  - `ADMIN_EMAIL` (where new-case and landlord-reply alerts go)
  - `CRON_SECRET` = any long random string (e.g. `openssl rand -hex 32`). Vercel
    sends it to the daily follow-up-notice cron; without it the cron refuses to run.
  - Then redeploy (Deployments → ⋯ → Redeploy).
- [ ] Resend → Inbound: confirm `reply.usetribune.org` forwards to
      `https://usetribune.org/api/webhooks/resend/inbound`. Copy the signing secret
      into Vercel as `RESEND_WEBHOOK_SECRET`. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase →
      Settings → API) so the webhook can log replies. Without these, landlord replies
      still reach the Cloudflare → Gmail route only if a catch-all exists, and won't
      be logged automatically.
- [ ] Supabase → Auth → URL Configuration: `https://usetribune.org/**` is in the
      redirect allowlist.
- [ ] Confirm `is_admin = true` on your prod profile (Supabase → Table editor → profiles).

## Part B — makes the loop safer and smarter (free, do when you can)

- [ ] **GitHub:** Settings → Branches → protect `main`: require the `check` status
      and a PR; allow squash merge; don't require reviews (the loop self-merges).
- [ ] **Staging:** create a second Supabase project (free tier). Put its URL, anon
      key, service role key, and DB URL in `.env.staging.local` (gitignored). The
      agent applies migrations and writes a seed script. Until this exists, schema
      migrations are 🔴 and UI can't be browser-tested without touching prod.
- [ ] **Read-only prod role:** run `ops/sql/readonly_role.sql` in the Supabase SQL
      editor (set the password first). Store the connection string as
      `SUPABASE_READONLY_DB_URL` in `.env.local`. Unlocks weekly metrics and the ops tick.
- [ ] **Sentry:** an auth token with read scopes → `SENTRY_AUTH_TOKEN`.
- [ ] **PostHog:** authorize the PostHog MCP (`/mcp` in a terminal session).
- [ ] **Cloud environment:** in Claude Code on the web, add the read-only DB URL and
      the staging values to the routine's environment, so cloud ticks can use them.
- [ ] **Google Search Console:** verify `usetribune.org` (DNS TXT on Cloudflare).
- [ ] Delete the orphaned E2E object `case-documents/f75ab011-…/*.pdf` in Storage.
