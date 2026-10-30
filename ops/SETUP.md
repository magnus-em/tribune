# Magnus's Setup

Everything here needs a human: accounts, credentials, or decisions the agent may
not make. All of it is free. Check items off in place; the next tick picks up
whatever is done. **Never paste secret values into this file or any committed file.**

## Part A — minimum before the first real case (~20 min)

Without these, letters and notifications don't send in production.

- [ ] Run `vercel login` locally (the CLI token expired).
- [ ] Vercel → tribune → Settings → Environment Variables (Production):
  - `RESEND_API_KEY` (the key in `.env.local` works; it's verified)
  - `RESEND_FROM_EMAIL` = `hello@usetribune.org`
  - `NEXT_PUBLIC_SITE_URL` = `https://usetribune.org`
  - `NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE` (for the Venmo/Zelle invoice instructions)
  - `ADMIN_EMAIL` (where new-case and landlord-reply alerts go)
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
