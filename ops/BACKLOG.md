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

**Until the first real case has run end to end, add no tenant-flow features.** The
flow from intake to letter to recovery is built. What's missing is tenants. Build
what brings them in or makes the site trustworthy to them. On 10-31 the Supabase project was
found paused, so nobody could sign in, and the loop hadn't noticed (see LOOP.md,
health check).

1. Voice and accuracy: the landing page (`src/app/page.tsx`) FAQ and about copy
   say "we"/"us", and state unverified figures ("4–8 weeks", "filing fees under
   $75"). Make Tribune the actor and drop or source the figures. Same for
   `LandlordIntroStep` ("our messages", "authorizes us") and `RecoveryStep` ("so
   we can close your case"). This is the first page a tenant reads.
2. ⚖️ Deadline calculator at `/tools/deposit-deadline`: move-out date in, the
   § 47a-21 return deadline out, with a link to start a case. This is what a
   tenant searches for the week the deposit doesn't arrive. Only verified
   statute text (LEGAL_REVIEW_47a-21.md). If the forwarding-address branch can't
   be computed from verified text, say so on the page rather than guess.
3. ⚖️ More guide pages, answering questions tenants actually search ("landlord
   kept my security deposit CT", "itemized list of damages CT", "security
   deposit interest CT"). Then New Haven, Hartford, Bridgeport, Stamford pages,
   only where there's something specific to say. Only verified statute text.
4. Invoice email: the late-payment notice states 1.5%/month interest and credit
   reporting "per your service agreement". Check the service agreement actually
   says that; if not, drop it (unbacked claims to a tenant).

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

- Doc drift: ARCHITECTURE.md and SPEC.md vs. the code.
- Migrate `next lint` → ESLint CLI.
- RLS: "Tenants can update own cases" allows any column (status,
  `current_letter_number`, amounts). Narrow it — a column-limited policy or a
  trigger — so tenant writes go only through the server actions. Needs a
  migration (see the migration note below).
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

- 2026-11-01 — Email-template tests: one table-driven suite over all six
  templates (case update, declined, submitted, invoice, follow-up
  available/reminder, landlord letter) checks the not-a-law-firm disclaimer,
  Tribune voice (no we/us/our/I/the team/the admin/Magnus), HTML escaping, and
  no stray contact details. Found and fixed: templates interpolated names,
  addresses, and messages unescaped (a tenant's name could inject markup into
  the landlord email); now a shared `escapeHtml` in `src/lib/email/escape.ts`
  and case ids are URL-encoded. Voice fixes: invoice "so we can match it" and
  the admin dispatch notice "We'll notify you". Letter text is unchanged
  (escaped plain text renders the same).
- 2026-11-01 — Build fix: Google Fonts self-hosted. `next build` on main failed
  (#19's push) because `next/font/google` got a bad response from Google at build
  time; the code was fine. The five Google families (latin subset, SIL OFL) now
  live in `src/app/fonts/` and load via `next/font/local`. The build no longer
  needs the network (verified with the proxy blocked).
- 2026-10-31 — Residential confirm for older cases: when triage blocks only on
  a missing residential answer (lease on file), the approval panel asks the
  tenant to tick "I rented this property as my home…" and confirm.
  `confirmResidentialTenancy()` runs under the tenant session, refuses when an
  answer is already on record (so a "no" can't be overwritten), and writes the
  same intake marker. New `needs: "residential"` state; the lease is asked for
  first.
- 2026-10-31 — Residential-vs-commercial question at intake ("Did you rent this
  property as your home?"). "No" stops the intake with a residential-only
  message; the server schema requires "yes". `createCase` records the answer as
  a tenant-visible system message (`dispatch_metadata.attestation =
  "residential_tenancy"`; a `case_actions` row would need a new enum value,
  which means a migration). `triageCase` now reads it: yes → pass, no →
  decline, no answer → review. The check is no longer informational, so
  approve-and-send needs the answer before a letter can go out.
- 2026-10-31 — ⚖️ Landlord-reply handling on the tenant page: when the case is
  `landlord_responded`, a "Your landlord replied" panel shows the latest reply
  and the options (report a recovery; review the next letter; or, with no letter
  left, Tribune reviews within the SLA). Copy says the choice is the tenant's and
  is information, not advice. New pure `replyFollowUpOffer()`: after a reply
  since the last letter, Letter 2 or 3 can be offered without the business-day
  wait; the 5-day cooldown, kill switch, triage, recovery stop, and tenant
  approval all still apply, and the letter uses the existing "your response did
  not resolve the matter" wording. The cron path (`followUpOffer`,
  `awaiting_landlord` only) is unchanged. The cooldown block now says when the
  letter becomes available. Letter templates unchanged.
- 2026-10-31 — Follow-up, slice 4 of 4 — one reminder nudge: the daily cron
  emails the tenant once more if Letter 2 or 3 is still waiting for approval 5
  calendar days after the "ready" notice (`follow_up_reminder` marker, never more
  than one per letter; none after approval or once the case leaves
  `awaiting_landlord`). Copy makes no deadline or urgency claims. Statutory-
  deadline nudges are deliberately out: the stored deadline ignores the
  forwarding-address branch, so they wait on that ⚖️ item.
- 2026-10-31 — Follow-up, slice 3 of 4 — daily cron `/api/cron/follow-up-notices`
  (Vercel Cron, `vercel.json`, 14:00 UTC). Pure `planFollowUpNotices()` /
  `followUpNoticeDecision()` in `src/lib/letters/follow-up-notice.ts`: notifies the
  tenant once per letter when `followUpOffer()` says Letter 2 or 3 is due. Writes a
  tenant-visible system message (the dedupe marker, `dispatch_metadata.notice`)
  and emails the tenant. Never contacts a landlord, sends no letter. Stopped by
  `DISPATCH_PAUSED`; refuses every request until `CRON_SECRET` is set (SETUP Part A).
  Also: `sendEmail` no longer logs the recipient when Resend is unconfigured.
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
