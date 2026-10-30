# Magnus's One-Time Setup

Everything here needs a human: accounts, credentials, or decisions the agent may
not make. It should take about 1.5–2 hours. Check items off in place; the next
tick picks up whatever is done. **Never paste secret values into this file or
any committed file.**

Ordered by what unblocks the most.

## 1. Legal (15 min to start, then waiting)
- [ ] Book a consult with a CT attorney who does landlord-tenant work.
- [ ] Send them `ops/legal-packet.md` (the agent can produce a PDF on request).
- [ ] Write the answer into `ops/ESCALATIONS.md` under E-002 when you have it.

## 2. GitHub (10 min) — lets the loop ship safely
- [ ] Merge the Phase 0 PR so CI exists on `main`.
- [ ] Settings → Branches → protect `main`: require the `check` status to pass,
      require a PR, allow squash merge. Don't require reviews; the loop self-merges.
- [ ] Make sure the Claude GitHub app has access to `magnus-em/tribune`
      (needed for cloud routines to push branches and open PRs).

## 3. Vercel (15 min) — the launch blockers from TASKS.md
- [ ] Run `vercel login` locally (the CLI token expired). Optionally
      `npm i -g vercel@latest`.
- [ ] Production env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=hello@usetribune.org`,
      `NEXT_PUBLIC_SITE_URL=https://usetribune.org`, `NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE`,
      `ADMIN_EMAIL`, `RESEND_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (inbound
      webhook only), and optionally `XAI_API_KEY`.
- [ ] Create a Vercel access token for the loop (read deployments + env names).
      It goes in the cloud environment (step 7), not in the repo.

## 4. Supabase (30 min)
- [ ] Create a **staging** project (free tier). Give the agent its URL, anon key,
      service role key, and DB URL by putting them in `.env.staging.local`
      (gitignored) and in the cloud environment. The agent applies the migrations
      and writes a seed script.
- [ ] Run `ops/sql/readonly_role.sql` on **prod** (set the password first). Store the
      connection string as `SUPABASE_READONLY_DB_URL` in `.env.local` and the cloud
      environment.
- [ ] Add the prod domain to the Supabase Auth redirect URL allowlist, if it isn't there.
- [ ] Confirm `is_admin = true` on your prod profile.
- [ ] Delete the orphaned E2E object `case-documents/f75ab011-…/*.pdf` in Storage.

## 5. Email (10 min)
- [ ] Resend → Inbound: confirm `reply.usetribune.org` routes to the webhook
      `https://usetribune.org/api/webhooks/resend/inbound` (the MX record already
      points at Resend). Copy the signing secret into Vercel as `RESEND_WEBHOOK_SECRET`.

## 6. Observability (10 min) — so the agent can see how things are going
- [ ] Sentry: create an auth token with read scopes (org, project, events) → `SENTRY_AUTH_TOKEN`.
- [ ] PostHog: authorize the PostHog MCP in Claude (`/mcp` in a terminal session),
      or create a read-only personal API key → `POSTHOG_API_KEY`.
- [ ] Google Search Console: verify `usetribune.org` (DNS TXT on Cloudflare). API
      access for the agent can wait until SEO pages exist.

## 7. Cloud environment for the loop (15 min)
- [ ] In Claude Code on the web, create an environment for `magnus-em/tribune` holding:
      `SUPABASE_READONLY_DB_URL`, the staging Supabase values, `VERCEL_TOKEN`,
      `SENTRY_AUTH_TOKEN`, `POSTHOG_API_KEY`. No prod service-role key.
- [ ] Tell the agent it exists; it then creates the build, ops, and review routines.

## 8. Claude Code permissions (5 min)
- [ ] Allow the agent's prod reads through the read-only role. Today's attempt was
      blocked by the auto-mode classifier. Add an allow rule for the metrics
      command (the agent will give you the exact rule once the role exists).

## Later (Phase 3)
- [ ] Stripe account, when payments are next.
- [ ] Spending caps for any paid channel or service.
