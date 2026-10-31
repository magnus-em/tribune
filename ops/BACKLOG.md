# Backlog

The build tick takes the top unblocked item in **Now**. Since 2026-10-30 everything
is 🟢 (do it, merge on green) unless marked 🔴 (spends money or contacts people).
See `ops/CHARTER.md`. ⚖️ marks legal content: the charter's legal rules apply, and
the item goes in the digest's "Legal changes" list. `blocked:` means don't start it;
the reason says what unblocks it. Keep items PR-sized. Split anything bigger before
starting.

**Priority: the first paid recovery.** Zero cash. No attorney. Anything that doesn't
move a real case toward a paid invoice waits.

## Now

1. ⚖️ **Tenant approve-and-send (Letter 1) — slice 2: tenant UI.** On the tenant
   case page, when `getLetterForApproval(caseId, 1)` returns `ok`, show the letter,
   the required checkbox (`APPROVAL_STATEMENT`), and **Approve & send** calling
   `approveAndSendLetter`. When it's blocked for a reason the tenant can fix
   (`no_forwarding_address`, `no_landlord_email`, lease missing), say what's needed.
   Also update the "Tribune is reviewing" banner/`STATUS_DESCRIPTIONS` copy so it
   doesn't contradict the button. Slice 1 (server side) is done.
2. **Summer-cohort page + outreach drafts** — `/moved-out` landing page: "Moved
   out this summer and never got your deposit back?" Restates only verified
   § 47a-21 text, carries the disclaimer, CTA to intake. Plus
   `ops/outreach/posts.md`: 3 ready-to-paste posts (Yale grad lists, r/newhaven,
   New Haven housing groups) with each venue's self-promotion rules noted.
   Drafts only. Magnus posts them (contacting people is 🔴).
3. **Admin exception queue** — read-only `/admin` view: new intakes, landlord
   replies with no follow-up, cases within 3 days of a deadline, overdue invoices.
4. **SEO foundation** — `sitemap.ts`, `robots.ts`, per-page metadata, Open Graph,
   `LegalService`/`FAQPage` structured data. No new deps.
5. ⚖️ **CT deposit law guide** — `/guides/connecticut-security-deposit-law`,
   restating only verified statute text, with sources and the disclaimer.

## Spec — tenant approve-and-send

- **Where:** the tenant case page. When Letter N is due, show the letter
  generated server-side from the template and the case data, a required checkbox
  ("I've read this letter, it's accurate, and I authorize Tribune to send it to
  my landlord in my name"), and an **Approve & send** button.
- **When due:** Letter 1 once intake is complete, the lease is uploaded, and
  `triageCase()` says `accept`. Letters 2 and 3 come later via the follow-up cron.
- **Server action `approveAndSendLetter(caseId, letterNumber)`:**
  1. Under the tenant's session: load the case (RLS proves ownership). Check the
     status allows it, `letterNumber === current_letter_number + 1`, a landlord
     email exists, `DISPATCH_PAUSED` isn't `true`, and there's been no dispatch on
     this case in the last 5 days.
  2. Regenerate the letter server-side. Never accept letter text from the client.
  3. Scoped privileged write (service-role client, used only in this function):
     insert the `tribune_letter` message, send it through the existing
     landlord-letter wrapper and reply-to, record the dispatch metadata, set status
     `awaiting_landlord`, increment `current_letter_number`, add a `case_actions`
     audit row noting tenant approval and time, and add a tenant-visible system
     message ("You approved Letter N; Tribune sent it").
  4. Send an FYI email to `ADMIN_EMAIL`.
- **No migration.** Approval is recorded in `case_actions` and `case_messages`.
- **Kill switch:** the `DISPATCH_PAUSED` env var stops every automated dispatch.
- **Tests:** eligibility rules, the server-side regeneration (client text
  ignored), the kill switch, the rate limit.

## Next

- Follow-up cron (Vercel Cron, free tier): after 10 business days with no reply
  and no recovery, offer the tenant Letter 2; after 7 more, Letter 3. Also
  deadline-risk nudges to the tenant. Never sends to a landlord without approval.
- Landlord-reply handling on the tenant page: show the reply and the next-step
  options (report recovery, send the next letter).
- Triage follow-up: a residential-vs-commercial question at intake, so that check
  stops being informational.
- Unit tests for email templates (disclaimer present, Tribune voice, no PII leaks).
- Doc drift: ARCHITECTURE.md and SPEC.md vs. the code.
- ⚖️ Deadline calculator tool at `/tools/deposit-deadline`.
- ⚖️ More guide pages, then city pages (only verified statute text).
- Migrate `next lint` → ESLint CLI.
- ⚖️ Capture the forwarding-address date and correct the deadline math. Needs an
  additive migration — blocked: cloud ticks can't apply migrations. Write it, and an
  interactive session applies it.
- Weekly metrics — blocked: read-only role (SETUP Part B).
- Staging + Playwright E2E — blocked: staging project (SETUP Part B).

## Later

- Referral program (roommates share a landlord)
- "Remind me" pre-move-out capture (needs a table; see the migration note above)
- 🔴 Stripe payment links (per-transaction fees) — after Venmo/Zelle proves to be
  a real problem
- 🔴 Certified mail for landlords without email (costs money per letter)
- Recovery verification; small-claims packet (⚖️); landlord memory; reply
  classification (🔴 if it needs a paid API)

## Done

- 2026-10-31 — ⚖️ Approve-and-send slice 1 (server side): `prepareLetterDispatch()`
  in `src/lib/letters/approve-and-send.ts` (eligibility, kill switch, 5-day rate
  limit, server-side regeneration; 40 tests), plus `getLetterForApproval` and
  `approveAndSendLetter` server actions. No UI yet, so nothing calls them.

- 2026-10-31 — Timeline deadline label: "(30 days)" → "(21 days)" from `STATUTE_DAYS`,
  with a test.
- 2026-10-30 — Full autonomy granted; build tick every 2 hours.
- 2026-10-30 — Letter defects fixed: follow-ups no longer state false facts (#4).
- 2026-10-30 — Triage function: `triageCase()` in `src/lib/triage.ts` with 31 tests,
  verdict shown on the admin case page (display only) (#5).
- 2026-10-30 — Re-planned around founder decisions (no attorney, $0, revenue first).
- 2026-10-28 — Plan + charter approved; stale tests rewritten around legal
  invariants; CI added; SLA copy made deliverable; ops/ files; setup checklist.
