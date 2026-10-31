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

_Empty. The build tick takes the top of **Next**._

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

- Follow-up, slice 3 — cron (Vercel Cron, free tier): a daily route that emails
  the tenant when Letter 2 or 3 becomes available (transactional, about their own
  case). Respects `DISPATCH_PAUSED`. Never sends to a landlord.
- Follow-up, slice 4 — deadline-risk nudges to the tenant.
- Landlord-reply handling on the tenant page: show the reply and the next-step
  options (report recovery, send the next letter).
- Triage follow-up: a residential-vs-commercial question at intake, so that check
  stops being informational.
- Unit tests for email templates (disclaimer present, Tribune voice, no PII leaks).
- Doc drift: ARCHITECTURE.md and SPEC.md vs. the code.
- ⚖️ Deadline calculator tool at `/tools/deposit-deadline`.
- ⚖️ More guide pages, then city pages (only verified statute text).
- Migrate `next lint` → ESLint CLI.
- RLS: "Tenants can update own cases" allows any column (status,
  `current_letter_number`, amounts). Narrow it — a column-limited policy or a
  trigger — so tenant writes go only through the server actions. Needs a
  migration (see the migration note below).
- Voice and accuracy: the landing page (`src/app/page.tsx`) FAQ and about copy
  say "we"/"us", and state unverified figures ("4–8 weeks", "filing fees under
  $75"). Make Tribune the actor and drop or source the figures.
- Voice: `LandlordIntroStep` says "our messages" / "authorizes us"; and the
  `RecoveryStep` says "so we can close your case". Tribune is the actor.
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

- 2026-10-31 — Follow-up, slice 2 of 4 — tenant UI: `nextLetterToOffer()` picks
  the letter the case page asks about (1 in setup, 2 or 3 while
  `awaiting_landlord`). The approval panel shows Letter N for approval, or
  "Letter N becomes available on …" while the schedule's wait runs (new
  `availableOn` on the blocked plan, `waiting` panel state). Approve & send
  posts the right letter number. Server rules unchanged.
- 2026-10-31 — ⚖️ Follow-up schedule, slice 1 of 4: pure `followUpOffer()` in
  `src/lib/letters/follow-up.ts` (Letter 2 at 10 business days after Letter 1,
  Letter 3 at 7 after Letter 2; only while `awaiting_landlord`, no landlord reply
  since the last letter, no recovery reported). `prepareLetterDispatch` now
  accepts Letters 2 and 3 when the schedule offers them and fills in the earlier
  letters' send dates. Letter templates unchanged. No UI yet.
- 2026-10-31 — ⚖️ CT deposit law guide at `/guides/connecticut-security-deposit-law`:
  quotes § 47a-21(d) verbatim (deadline and damages, from `src/lib/statute.ts`),
  plain restatements of both deadline branches, delivery options (A)/(B), the
  damages rule and its interest-only exception, a "not covered here" list
  (interest rate, itemization detail, other subsections, case law), sources, and
  the disclaimer. In the sitemap; linked from the landing and /moved-out footers.
- 2026-10-31 — SEO foundation: `sitemap.ts` (/, /moved-out), `robots.ts`
  (disallows admin, dashboard, api, auth, login, demo), `metadataBase`, Open
  Graph and Twitter metadata, a canonical on /moved-out, `FAQPage` JSON-LD from
  the /moved-out FAQ, and site-wide `Organization`/`ProfessionalService` JSON-LD.
  Deliberately not `LegalService`: schema.org defines it as advice and
  representation. Root description no longer says "unless we recover".

- 2026-10-31 — Admin exception queue on `/admin`: pure `buildExceptionQueue()`
  in `src/lib/exceptions.ts` (25 tests) sorts cases into new intakes, landlord
  replies with no later Tribune letter/update, stored statutory deadline within
  3 days, and overdue invoices (past due, `overdue`, or `collections`). Read-only.

- 2026-10-31 — ⚖️ Summer-cohort page `/moved-out`: quotes § 47a-21(d) verbatim
  from `src/lib/statute.ts` (a test checks the quotes against
  LEGAL_REVIEW_47a-21.md), what to gather, how Tribune works, FAQ, the
  disclaimer at the top and bottom, CTAs to intake. Plus `ops/outreach/posts.md`:
  3 drafts (Yale lists, r/newhaven, Facebook groups) with venue rules to check.
  Magnus posts them; the agent doesn't.

- 2026-10-31 — ⚖️ Approve-and-send slice 2 (tenant UI): the tenant case page shows
  the server-generated Letter 1, the `APPROVAL_STATEMENT` checkbox, and
  **Approve & send**; when the landlord email or forwarding address is missing the
  tenant adds it in place (`updateLetterContactDetail`); a missing lease points to
  the upload. Review-banner and `STATUS_DESCRIPTIONS` copy now say nothing is sent
  without the tenant's approval. Not browser-verified (no staging).

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
