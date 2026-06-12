# Email Infrastructure Setup (Resend)

What has to be true for Tribune's email to work in production: outbound letters
land in inboxes (not spam), landlords can reply, and those replies flow back into
the case automatically.

## How the code uses email (so the config matches reality)

- **Sender:** `RESEND_FROM_EMAIL` (default `hello@usetribune.org`), shown as
  `Tribune <…>`. — [src/lib/email/client.ts](src/lib/email/client.ts)
- **Reply-To on landlord letters:** `case+{caseId}@usetribune.org`. This is the
  address landlords reply to, and the case id is embedded in it.
  — [dispatchLetter, actions.ts](src/app/admin/case/[id]/actions.ts)
- **Inbound webhook:** `POST /api/webhooks/resend/inbound` parses
  `case+{caseId}@…`, fetches the reply body, logs it as a `landlord_reply`, flips
  the case to `landlord_responded`, and emails the admin. It now **requires
  `RESEND_WEBHOOK_SECRET` in production** (fails closed without it).
  — [route.ts](src/app/api/webhooks/resend/inbound/route.ts)

## ⚠️ Decision that affects a code change: which domain receives replies

The reply-to is currently on the **root** domain `usetribune.org`. To receive
inbound email, that domain needs **MX records pointing to Resend** — but if
`hello@usetribune.org` is a real mailbox (Google Workspace, etc.), pointing the
root MX at Resend would **break your normal mail**.

Standard fix: use a **subdomain** for inbound, e.g. `reply.usetribune.org`, so
the reply-to becomes `case+{caseId}@reply.usetribune.org`. Then only that
subdomain's MX points to Resend and your main mail is untouched. If you go this
route, the reply-to in `dispatchLetter` must be updated to the subdomain (one-line
change — I can do it once you pick the subdomain).

## Steps

### 1. Sending domain (DKIM/SPF) — so letters don't go to spam
- Resend dashboard → **Domains** → add `usetribune.org`.
- Add the **DKIM** (CNAME/TXT) and **SPF** (TXT) records Resend shows you to your
  DNS provider. Verify in Resend.
- Add a **DMARC** TXT record at `_dmarc.usetribune.org`, e.g.
  `v=DMARC1; p=none; rua=mailto:postmaster@usetribune.org` (start with `p=none`
  to monitor, tighten later).

### 2. Sending env vars (Vercel → Project → Settings → Environment Variables)
- `RESEND_API_KEY` — production key from Resend.
- `RESEND_FROM_EMAIL` — `hello@usetribune.org` (or your chosen sender).
- `NEXT_PUBLIC_SITE_URL` — `https://usetribune.org` (used in email links).
- `ADMIN_EMAIL` — where "landlord replied" notifications go (e.g. your inbox).

### 3. Inbound (receiving landlord replies)
- Resend dashboard → enable **inbound/receiving** for your chosen domain or
  subdomain (`reply.usetribune.org` recommended).
- Add the **MX record** Resend gives you for that (sub)domain.
- If you chose a subdomain, tell me and I'll update the reply-to in code to match.

### 4. Webhook
- Resend dashboard → **Webhooks** → add endpoint:
  `https://usetribune.org/api/webhooks/resend/inbound`
- Subscribe to the **`email.received`** event.
- Copy the **signing secret** → set `RESEND_WEBHOOK_SECRET` in Vercel
  (required in prod now).

### 5. Smoke test (after deploy)
1. From the admin UI, dispatch a Letter 1 to a landlord address **you control**.
2. Confirm it arrives, From `Tribune`, Reply-To `case+{id}@…`.
3. Reply to it.
4. Confirm: the case flips to `landlord_responded`, a `landlord_reply` appears in
   the timeline, and the admin notification email arrives.

## Env var checklist
| Var | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Vercel | send + fetch inbound bodies |
| `RESEND_FROM_EMAIL` | Vercel | sender address |
| `RESEND_WEBHOOK_SECRET` | Vercel | **required in prod**; verifies inbound webhook |
| `ADMIN_EMAIL` | Vercel | landlord-reply notifications |
| `NEXT_PUBLIC_SITE_URL` | Vercel | links in emails |
