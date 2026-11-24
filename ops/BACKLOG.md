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

**Review 2026-11-23: the blocker still isn't code.** In order, what stands
between today and the first paid recovery:
- blocked: Magnus — restore the Supabase project (SETUP Part A, first item).
  `/api/health` 503 since 2026-10-31 (day 24 on 11-23). Supabase's restore window
  for a paused free project is about 90 days (~late January 2027).
- blocked: Magnus — rest of SETUP Part A (Google OAuth "In production", Resend
  SMTP in Supabase, Vercel env vars incl. `CRON_SECRET` and
  `SUPABASE_SERVICE_ROLE_KEY`). Without them sign-up emails, letters, and
  notifications don't send.
- 🔴 Magnus posts `ops/outreach/posts.md`, after the two items above (see digest).

Before the first real letter goes out, the letters must not state a wrong fact in
the tenant's name. Items 1 and 2 fix the two places where they can. Both are
`test-ok` (LOOP.md): no backend needed, so build ticks take them while it's down,
one PR a day.

1. ⚖️ `test-ok` **Letter 1 can state a wrong deadline date.** It tells the landlord
   "That deadline was <date>, and it has passed", and the date is the stored
   `statutory_deadline` (move-out + 21). It ignores the "15 days after the
   forwarding address" branch that the same paragraph recites. Example: move-out
   6/1, landlord gets the forwarding address 6/15, real deadline 6/30. A tenant who
   starts on 6/25 passes triage (`deadline_passed` reads the stored date), and
   Letter 1 says 6/22 "has passed". Fix without a migration, in slices:
   a. ~~Pure: `letterDeadline(caseRow, forwardingNoticeDate | null)` reusing
      `computeDepositDeadline()`. Tests for both branches and the crossover.~~
      Done 2026-11-23 (`src/lib/letters/deadline.ts`, plus
      `letterDeadlinePassed()`). Not wired in yet; slice b does that.
   b. ~~Record/read the forwarding-notice answer; letters and triage use the
      computed date; `prepareLetterDispatch` blocks until answered.~~ Done
      2026-11-24 (pure half; see Done). **Until c lands, no letter can be
      prepared** (the block has no tenant-side way to clear it yet).
   c. The tenant answers on the case page: a server action that writes the
      system message with `forwardingNoticeAttestationMetadata()` (same pattern
      as `confirmResidential`), and an `approvalPanelState` need for the
      `forwarding_notice` block reason (date picker, "I didn't give it in
      writing", "I don't know"; message `FORWARDING_NOTICE_NEED_MESSAGE`). A
      small change to the existing panel, like the residential confirm. The
      stored `statutory_deadline` column stays as-is until the migration in
      Next. Also: the tenant timeline (`case-timeline.tsx`) and the
      case-submitted email still show the stored move-out + 21 date as "the
      deadline"; relabel them in the same slice or the next.
2. ⚖️ `test-ok` **The case page misdescribes the letters.** `tenantLetterTactics()`
   (`src/app/dashboard/case/[id]/_components.tsx` ~line 634) says Letter 1 sets a
   "14-day reply window" (the letter says 10 business days), "silence converts into
   the next round automatically" (every letter needs the tenant's approval),
   "document the deadline they already missed", Letter 2 names "fee shifting" (not
   in the letter or the verified text), and Letter 3 promises "the court summons"
   (Tribune doesn't file anything). Rewrite the bullets to say only what each
   template actually says, in Tribune's voice, as information. Move them to a lib
   module with a test that every number and claim in them appears in that letter's
   template. This replaces the old "fee shifting" item.
3. Guide pages (old Now #1): **done for now.** Five guides, the calculator, and the
   `/guides` index cover the verified § 47a-21(d) text. An interest guide waits on
   a verified interest rate. City pages wait on something city-specific to say.
   Don't add more topic pages from the same text.

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
- ⚖️ Store the forwarding-address date in a column and correct the stored
  `statutory_deadline` (after Now #1, which fixes the letter without a migration).
  Needs an additive migration — blocked: cloud ticks can't apply migrations. Write
  it, and an interactive session applies it.
- ⚖️ Letter 3 says "I will not write again. The next document you receive from this
  matter will be a summons." The tenant signs that. It holds only if the tenant
  actually files, and Tribune doesn't file. #4 removed the "no further demand"
  wording from Letters 2 and 3, but this line stayed. Decide whether to soften it to
  the letter's own "I intend to file". Flag the wording choice in the PR. No
  verified text covers it.
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

- 2026-11-24 — ⚖️ Now #1b (`test-ok`): the tenant's forwarding-notice answer
  (`date` / `not_given` / `unknown`) is stored as a system message
  (`dispatch_metadata.attestation = "forwarding_notice"`) and read by
  `forwardingNoticeAnswer()`. `caseLetterDeadline()` = `letterDeadline()`,
  never earlier than the stored column. Letters 1–3 state that date; with no
  notice date they recite the 21-day date as the earliest possible deadline and
  both branches with "whichever is later", and don't call it passed. Triage's
  `deadline_passed` uses it (`unknown` → review with no answer).
  `prepareLetterDispatch` blocks every letter with `forwarding_notice` until
  answered. 30 new tests. The tenant can't answer yet: slice c.
- 2026-11-23 — ⚖️ Now #1a (`test-ok`): pure `letterDeadline(caseRow,
  forwardingNoticeDate | null)` in `src/lib/letters/deadline.ts` maps a case onto
  `computeDepositDeadline()` (later of move-out + 21 and notice + 15; null date →
  move-out + 21 flagged `forwarding_unknown`). `letterDeadlinePassed()` returns
  true/false, or null when only the earliest possible date has passed, so a letter
  can't call an unknown deadline passed. 9 tests (the BACKLOG 6/1 → 6/30 example,
  early notice, crossover, unknown, invalid dates). Nothing calls it yet; Letter 1
  and triage switch in slice b.
- 2026-11-23 — Review: the guide-pages item is closed (five guides, the calculator,
  and the index cover the verified (d) text). Letter 1's deadline defect and the
  case-page tactics bullets are queued as `test-ok` Now #1–2; Letter 3's
  "summons" line is in Next. LOOP.md now allows `test-ok` items while the backend
  is down.
- 2026-11-21 — `/guides` index (`static-ok`): one page listing all five guides and
  the deadline calculator, each with a one-line note on which part of § 47a-21(d)
  it reads (no legal claims of its own; list lives in `src/lib/guides.ts`). In
  the sitemap; "All guides" linked from the landing, every guide, and the
  calculator footers. 5 tests, incl. every guide route under `src/app/guides` is
  listed and every link is a real sitemap page. Taken instead of a sixth topic
  page: the verified (d) text is now covered by deadline, forwarding address,
  itemization, and damages pages; interest needs the rate verified, and no
  city-specific text is verified. Review tick: decide whether Now #1 is done.
- 2026-11-20 — ⚖️ Guide `/guides/security-deposit-double-damages-connecticut`
  (`static-ok`): for the "security deposit double damages CT" search. Quotes the
  verified § 47a-21(d) liability sentence; five phrase cards, each a verbatim
  fragment (tested). Illustrative arithmetic, labeled as made up: $1,400 deposit →
  $2,800; interest-only violation with $3 / $8 interest → $10 / $16 ("whichever is
  greater", both branches tested). Says the figure is measured against the deposit
  paid, not the amount kept, and that the verified text is silent on subtracting
  amounts returned (the case-law question LEGAL_REVIEW flags). Not covered:
  liability in a given case, amounts returned/good faith, how a court computes an
  award, court procedure and filing limits, interest rate, day counting, other
  subsections, case law. In the sitemap; linked from the landing, all four guides,
  and the calculator. 17 tests.
- 2026-11-19 — ⚖️ Guide `/guides/security-deposit-forwarding-address-connecticut`
  (`static-ok`): for the "security deposit forwarding address CT" search. Quotes the
  verified § 47a-21(d) deadline and damages text; cards restate the four phrases
  that involve the forwarding address (both clocks, "whichever is later", "at such
  forwarding address"). Two worked examples (tenancy ends 5/31/2026; notice 5/25 →
  6/21, notice 6/15 → 6/30) computed by `computeDepositDeadline()` and tested, plus
  the crossover date (6/6). Says an earlier notice never moves the deadline earlier
  than 21 days. Not covered: what counts as written notification, delivery method,
  proof of receipt, no/changed forwarding address, compliance, day counting,
  interest rate, other subsections, case law. In the sitemap; linked from the
  landing, all three guides, and the calculator. 15 tests.
- 2026-11-18 — ⚖️ Guide `/guides/itemized-statement-of-damages-connecticut`
  (`static-ok`): for the "itemized list of damages CT" search. Quotes the verified
  § 47a-21(d) itemization fragment, deadline, and damages text; cards restate each
  statute phrase the statement turns on ("a written statement", "itemizing the
  nature and amount of such damages", "together with", "at such forwarding
  address", the deadline). Says the verified text doesn't say how detailed a
  statement must be or which charges count. Not covered: compliance, detail, wear
  and tear/cleaning/painting, receipts/estimates/photos, interest rate, day
  counting, other subsections, case law. In the sitemap; linked from the landing
  and both guide footers. 13 tests (incl. every card phrase is a substring of the
  verified text; no charge or attachment claims outside the not-covered list).
- 2026-11-17 — ⚖️ Guide `/guides/landlord-kept-security-deposit-connecticut`
  (`static-ok`): for the "landlord kept my security deposit CT" search. Quotes the
  verified § 47a-21(d) deadline and damages text, then sets four situations (nothing
  arrived; part with no statement; part with a list of deductions; full deposit
  without interest) against the statute's words without saying whether any landlord
  complied. Lists what it doesn't cover (compliance, interest rate, itemization
  detail, day counting, other subsections, case law). In the sitemap; linked from the
  main guide and landing footers. 13 tests.
- 2026-11-16 — ⚖️ Landing "What they can't charge" section (`static-ok`): removed
  the unverified claims that wear and tear is "never deductible", the "Not
  deductible" stamps, "Most deduction lists don't hold up", and "Potentially void
  under § 47a-21". The section is now "What they have to itemize": it restates the
  verified § 47a-21(d) itemization requirement, says the statute text doesn't list
  which charges count as damages, and each example line shows what an itemized
  statement would state. The rule box quotes the (d) text verbatim
  (`STATUTE_ITEMIZATION_QUOTE` in `src/lib/statute.ts`, tested as a substring of
  the verified deadline quote). Nav and hero links renamed. Two new landing tests.
- 2026-11-16 — Invoice late-payment notice checked (review): the 1.5%/month interest
  and credit-reporting terms in `src/lib/email/templates/invoice.ts` match the
  service agreement shown at intake (`src/app/dashboard/new-case/_steps.tsx`,
  `KEY_CLAUSE_TEXT` and the agreement body). No change. Whether those terms are
  enforceable against a consumer in CT hasn't been reviewed (no attorney, by
  founder decision); flagged in the 11-16 digest.
- 2026-11-10 — ⚖️ Deposit deadline calculator at `/tools/deposit-deadline`
  (`static-ok`): tenancy end date in, § 47a-21(d) deadline out. Pure
  `computeDepositDeadline()` in `src/lib/deadline-calculator.ts`: tenancy end +
  21, optional landlord-received forwarding-address date + 15, the later wins.
  With no forwarding date the page labels the 21-day date the *earliest possible*
  deadline and gives the date after which a forwarding notice would move it later.
  Calendar days only; the page says it doesn't adjust for weekends/holidays, say
  how a court counts days, decide compliance, or compute interest. Quotes the
  verified deadline text; runs in the browser, stores nothing. In the sitemap;
  linked from the guide, landing, and /moved-out. 18 tests (lib + page).
- 2026-11-09 — ⚖️ Landing-page voice and accuracy (`static-ok`): Tribune is the
  actor throughout `/`, `/login`, `LandlordIntroStep`, `RecoveryStep`, and the
  lease-missing notice. Dropped the "4–8 weeks", "under $75", "$250–400/hr",
  "3–6 hrs", "thousands of notices", and "specialists" claims; the attorney figure
  in the calculator is labeled as an example. Law cards restate only § 47a-21(d)
  (both deadline branches, itemization, accrued interest, twice the deposit
  paid, forwarding address); dropped the unverified escrow/annual-statement and
  burden-of-proof cards and the "§ 1–5" labels. New landing test guards voice,
  figures, and the legal statements.
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
