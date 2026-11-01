# Journal

Newest first. One entry per tick. Counts only — no names, emails, addresses, or
per-case amounts.

## 2026-10-31 — manual — backend found paused; health check, keep-alive, refocus
- Did: Magnus reported Google sign-in failing on prod. Cause: the Supabase project
  was paused (`INACTIVE`, the hostname no longer resolves), so every sign-in,
  sign-up, and dashboard page failed. Restoring needs Magnus's Supabase login
  (SETUP Part A, first item). Added `/api/health` (Auth + one PostgREST read with
  the anon key, 200 or 503) and a daily Vercel cron that calls it, which keeps the
  free project active and emails `ADMIN_EMAIL` when it's down. The login page now
  shows a message on `?error=auth` instead of nothing. Preview builds are off for
  `loop/*` and `ops/*` branches (they cost build time and filled Magnus's inbox
  with Vercel bot comments). BACKLOG "Now" re-pointed at getting tenants in:
  landing copy, the deadline calculator, guide pages.
- Learned: the tick health check curled the static homepage, which returns 200 with
  the backend dead, so ~20 PRs merged onto a site nobody could use. It now checks
  `/api/health` and stops building when that fails.
- Next: Magnus restores the project; then confirm Google sign-in reaches the
  account chooser and `/api/health` returns 200.

## 2026-11-01 — build — email-template tests; escaping and voice fixes
- Did: Second item this tick (after #20). Table-driven tests over all six
  email templates: disclaimer, Tribune voice, HTML escaping, no stray contact
  details, plus subject and timeline copy for the follow-up notice. 40 new
  tests (410 total). The tests found that only the follow-up template escaped
  its input. Added a shared `escapeHtml`, and every template now escapes
  interpolated values and URL-encodes the case id. Fixed two "we" strings
  (invoice, admin dispatch notice). Mutation check: reverting the invoice copy
  fails the voice test.
- Learned: the invoice's late-payment notice (1.5%/month interest, credit
  reporting) may not be backed by the service agreement. Added to Next to check;
  not changed here.
- Next: doc drift, or the invoice late-fee check.

## 2026-11-01 — build — main CI red (Google Fonts flake); fonts self-hosted
- Did: Health check found main CI red on #19's push: `next build` died in
  `next/font/google` (`Cannot read properties of null (reading '1')`, the font
  URL had no file extension). Not a code bug: the same commit built fine on later
  local runs. Re-ran the failed job, then self-hosted the five Google families
  (latin subset woff2, SIL OFL) with `next/font/local` so the build never fetches
  from Google. Built with the network proxy blocked: passes. Checked in a local
  browser that `/`, `/login`, and `/contact` load the fonts. No open PRs at
  start; prod returned 200. 370 tests pass.
- Learned: any build-time network fetch is a CI flake source. Keep the build
  offline.
- Next: email-template tests, or doc drift.

## 2026-10-31 — build — residential confirm prompt for cases without an answer
- Did: Second item this tick, the follow-up to #18. `approvalPanelState` takes
  the residential answer. When triage blocks, the lease is on file, and there's
  no answer, the panel shows a confirm form (required checkbox + Confirm).
  `confirmResidentialTenancy()` writes the same marker under the tenant session
  and refuses a second answer. 5 new tests (370 total). Merged #18 first (CI
  green).
- Learned: deleting the merged `loop/` branch with `git push --delete` is
  refused here, same as before. Merged branches stay until someone deletes them.
  Not browser-verified (no staging, no tenant login).
- Next: email-template tests, or doc drift.

## 2026-10-31 — build — residential question at intake; triage now uses it
- Did: Took the top of Next (Now was empty). Intake step 1 asks "Did you rent
  this property as your home?" A "No" stops the intake with a residential-only
  message, and the server schema requires "yes". `createCase` writes the answer
  as a tenant-visible system message with a `dispatch_metadata` marker.
  `residentialAnswer()` reads it. Triage: yes → pass, no → decline, no answer →
  review, so it's no longer informational. Approve-and-send and the admin triage
  panel pass the answer through. The approve-and-send fixtures now carry the
  marker, and new tests cover a missing answer and a "no" answer (both blocked).
  22 new tests (365 total). No open PRs at start; main CI green; prod returned 200.
- Learned: `case_actions.action_type` is a Postgres enum, so a new action type
  needs a migration. A `system` message with metadata needs none (tenants may
  insert `system` rows under RLS). Cases created before this change have no
  answer, so they sit in review with nothing the tenant or admin can do. Real
  usage is believed to be zero, but it's in Next as a follow-up. Not
  browser-verified: the intake requires a login and there's no staging.
- Next: the legacy residential prompt, or the email-template tests.

## 2026-10-31 — build — landlord-reply handling on the tenant page (⚖️)
- Did: Took the top of Next (Now was empty). After a landlord reply the tenant
  case page shows the reply and the options: report a recovery, or review the
  next letter, which opens the existing approve panel. Nothing goes out without
  the approval checkbox. New `replyFollowUpOffer()` in `src/lib/letters/follow-up.ts`
  offers Letter 2/3 after a reply since the last letter, with no business-day wait.
  The cooldown, kill switch, triage, and recovery checks are unchanged. The cooldown
  block now carries `availableOn`, so the page says when the letter becomes
  available. 30 new tests (343 total). `nextLetterToOffer` now returns 2/3 for
  `landlord_responded`; that test table changed rows, and the server still decides.
  The "Letter 2 is blocked in landlord_responded" test (no reply on record) is
  unchanged and passes. No open PRs at start; main CI green; prod returned 200.
- Learned: the templates already handle `landlordResponded`, so Letters 2/3 don't
  claim "you did not respond" after a reply (now tested on the reply path). The
  daily cron only reads `awaiting_landlord` cases, so it never nudges after a
  reply. Not browser-verified: there's no staging and no tenant login.
- Next: residential-vs-commercial intake question, or the email-template tests.

## 2026-10-31 — build — follow-up slice 4: one reminder while a letter waits for approval
- Did: `followUpNoticeDecision()` now returns `kind: available | reminder`. If
  Letter 2 or 3 is still unapproved 5 calendar days after the first notice, the
  cron sends one reminder (in-app message + email, own dedupe marker). Approval,
  a landlord reply, a recovery, or the kill switch stop it. Reminder copy: nothing
  sent, approval stays with the tenant, "only reminder", disclaimer, no
  deadline/urgency words (tested). 14 new tests (313 total). One existing fixture
  got a realistic Letter 3 notice timestamp; its assertion is unchanged. No open
  PRs at start; prod returned 200.
- Learned: "deadline-risk" was ambiguous. A statutory-deadline nudge would rely on
  `statutory_deadline`, which ignores the 15-days-after-forwarding-address branch,
  so it could tell a tenant the wrong date. Left out until the forwarding-address
  date is captured. Not run against a database: no staging.
- Next: landlord-reply handling on the tenant page.

## 2026-10-31 — build — follow-up slice 3: daily cron emails the tenant when Letter 2/3 is ready
- Did: `/api/cron/follow-up-notices` plus a daily Vercel Cron entry (free tier).
  The planner (`src/lib/letters/follow-up-notice.ts`) reuses `followUpOffer()`
  and adds a once-per-letter dedupe through a tenant-visible system message
  (written before the email; removed if the email fails or is skipped, so the
  next run retries). New tenant email template with the disclaimer, Tribune
  voice, escaped first name only. 31 new tests (300 total). Fails closed without
  `CRON_SECRET` (added to SETUP Part A and `.env.example`); `DISPATCH_PAUSED`
  stops it. Removed the recipient address from `sendEmail`'s "skipped" log (PII).
  No open PRs at start; main CI green; prod returned 200.
- Learned: `action_type` is an enum without a fitting value, and cloud ticks
  can't apply migrations, so the dedupe marker lives in `case_messages`
  `dispatch_metadata` instead of `case_actions`. Notices are attributed
  (`created_by`) to an admin profile, as the inbound webhook already does.
  Not run against a database: no staging.
- Next: follow-up slice 4 (deadline-risk nudges to the tenant).

## 2026-10-31 — build — follow-up slice 2: tenant page offers Letters 2 and 3
- Did: The case page now asks the server about the next letter
  (`nextLetterToOffer()`: 1 in setup, 2 or 3 while awaiting the landlord), not
  always Letter 1, and approves that number. While the follow-up wait runs, the
  panel says "Letter N becomes available on …" with no checkbox or send button.
  `prepareLetterDispatch` sets `availableOn` only when time is the one thing
  missing; letter text and every block rule are unchanged. 17 new tests (279
  total). No open PRs at start; main CI green; prod returned 200.
- Learned: other follow-up blocks (landlord replied, missing dispatch record,
  kill switch, cooldown) keep the panel hidden; landlord-reply handling is its own
  backlog item. Not browser-verified: the case page needs a tenant login and
  there's no staging. `node_modules` was missing at tick start (`npm ci` fixed it).
- Next: follow-up slice 3 (daily cron emailing the tenant when Letter 2 or 3
  becomes available).

## 2026-10-31 — build — merged the CT law guide; follow-up schedule, slice 1
- Did: Merged #12 (CT deposit law guide), which had green CI and no reason to
  stay open. The follow-up cron was too big for one PR, so I split it into four
  slices in BACKLOG. Slice 1: `followUpOffer()` (`src/lib/letters/follow-up.ts`),
  and `prepareLetterDispatch` now allows Letters 2 and 3 once the schedule offers
  them. Letters 2 and 3 cite the earlier letters' send dates from the
  `letter_dispatched` audit rows. 38 new tests (262 total). The kill switch, cooldown,
  triage, and tenant approval apply unchanged. Main CI green; prod returned 200.
- Learned: business days skip weekends only; holidays aren't modeled, so a wait
  that spans one ends a day early. The waits are product cadence, not statutory
  periods. Letters 2 and 3 still say "You did not respond" when there's no
  landlord reply on file. The schedule only offers them in that case, and the
  tenant reads the letter before approving. Nothing calls Letters 2 or 3 yet,
  because the tenant page still asks only for Letter 1.
- Next: follow-up slice 2 (tenant UI for the next letter).

## 2026-10-31 — build — CT deposit law guide (⚖️)
- Did: `/guides/connecticut-security-deposit-law`. Every legal statement is either
  a verbatim § 47a-21(d) quote from `src/lib/statute.ts` or a plain restatement of
  one: the two deadline clocks (later controls), options (A) and (B), twice the
  deposit paid, and the interest-only exception (greater of $10 or twice the
  interest). 9 tests: quotes match LEGAL_REVIEW, no "30 days", damages base is the
  deposit not the withheld amount, no subsection other than (d), no case law or
  attorney's-fees/forfeiture language, sources linked, disclaimer, Tribune voice,
  no advice phrasing. Added to the sitemap and both public footers. Checked the
  production build in Chromium at 1280px and 390px: no errors, no horizontal scroll.
- Learned: LEGAL_REVIEW verifies only two passages of subsection (d), so the guide
  lists the interest rate, itemization detail, other subsections, and case law as
  "not covered" instead of summarizing them. I dropped a line about older 30-day
  versions of the statute because it comes from the review's note, not verified
  statute text. Local `next build` fails on Google Fonts unless
  `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` is set (sandbox proxy); CI is fine.
- Next: "Now" is empty. The next tick takes the top of "Next" (the follow-up cron).

## 2026-10-31 — build — SEO foundation (second item this tick)
- Did: sitemap and robots routes, `src/lib/seo.ts` (site URL, public routes,
  disallowed paths, JSON-LD builders with `</script>` escaping), root Open Graph
  and Twitter metadata, a canonical plus FAQPage JSON-LD on /moved-out, and
  Organization JSON-LD site-wide. 14 tests, including one that keeps
  `LegalService` and `Attorney` out of the structured data. Checked the built
  robots.txt, sitemap.xml, and /moved-out HTML.
- Learned: a canonical in the root layout would be inherited by every page and
  point them all at "/", so only /moved-out sets one. The landing page is a
  client component, so it can't export its own metadata. The landing FAQ was
  left out of the structured data: it says "we" and makes unverified claims
  ("most matters resolve in 4–8 weeks", "filing fees are typically under $75").
  That copy needs a voice and accuracy pass. Deleting merged branches on the
  remote was refused again.
- Next: ⚖️ CT deposit law guide. Landing copy voice/accuracy pass added to Next.

## 2026-10-31 — build — admin exception queue (read-only)
- Did: Added `buildExceptionQueue()` (`src/lib/exceptions.ts`, 25 tests) and an
  "Exception queue" panel at the top of `/admin` with four buckets: new intakes,
  landlord replies with no follow-up, stored statutory deadline within 3 days,
  overdue invoices. Two extra client reads under admin RLS (message types/times,
  unsettled invoices). Nothing writes or sends. No open PRs at start; main CI
  green; prod returned 200.
- Learned: "follow-up" is a later `tribune_letter` or `tribune_update`; tenant
  and system messages don't clear a landlord reply. Invoices aren't in the
  generated Supabase types (the client is untyped, so it compiles). The deadline
  bucket inherits the stored-deadline caveat (forwarding-address date not
  captured). Not browser-verified: `/admin` needs an admin login and there's no
  staging.
- Next: SEO foundation, then the CT deposit law guide.

## 2026-10-31 — build — summer-cohort page and outreach drafts
- Did: Added a public `/moved-out` page ("Moved out this summer and never got your
  deposit back?"). It quotes the two verified § 47a-21(d) passages word for word
  from a new `src/lib/statute.ts`, lists what to gather, explains approve-and-send
  and the 15% fee, and carries the disclaimer under the hero and in the footer.
  Every CTA goes to `/login?next=/dashboard/new-case`. 8 tests: the quotes match
  LEGAL_REVIEW_47a-21.md, no "30 days", the disclaimer, the CTA targets, no
  we/us/our, approval before sending. Wrote `ops/outreach/posts.md` with 3
  drafts and the venue rules to check first. No open PRs at start; main CI
  green; prod up.
- Learned: the page is public, so it was checked in a local browser (prod build,
  1280px and 390px, no horizontal scroll). The landing CSS reset strips list
  numbers, so ordered lists need `listStyle: "decimal"`. Nothing links to
  `/moved-out` from the landing page yet; the posts are its only traffic source,
  and SEO (sitemap, metadata) is BACKLOG Now #2. The venue rules in the drafts
  are things to check, not verified copies; the agent can't read logged-in pages.
- Next: the admin exception queue. Magnus: SETUP Part A, then post the drafts.

## 2026-10-31 — build — approve-and-send, tenant UI (slice 2 of 2)
- Did: The tenant case page now asks the server for Letter 1 while the case is in
  setup. If it's ready, it shows the exact server-generated letter, the required
  `APPROVAL_STATEMENT` checkbox, and **Approve & send** (`approveAndSendLetter`).
  If the landlord email or forwarding address is missing, the tenant adds it in
  place through a new `updateLetterContactDetail` action (session client, only
  before Letter 1, audit row without the value). A missing lease routes to the
  upload. Review-banner, headline, and `STATUS_DESCRIPTIONS` copy now say nothing
  is sent without the tenant's approval. Pure `approvalPanelState()` and
  `parseContactDetail()` with tests, plus a render test for the step (button stays
  disabled until the box is ticked). Letter text and citations are unchanged.
- Learned: not browser-verified: the page needs a real login and there's no
  staging, so a jsdom render test stands in. The tenant UPDATE policy on `cases`
  covers every column, so a tenant could edit status or amounts directly. The
  letter still only goes out on their own approval, but it's in BACKLOG "Next".
  The intro step and recovery step still say "us"/"we" (BACKLOG "Next").
  The end-to-end path is now live in code: a real Letter 1 can go out once
  SETUP Part A (email sending) is done.
- Next: the summer-cohort page and outreach drafts.

## 2026-10-31 — build — approve-and-send, server side (slice 1 of 2)
- Did: Split approve-and-send into server side + tenant UI and shipped the server
  side. `prepareLetterDispatch()` is pure: kill switch (`DISPATCH_PAUSED`), Letter 1
  only, next-in-sequence, status `intake_submitted`/`under_review`, landlord email,
  forwarding address, triage `accept`, no dispatch in 5 days, then the letter text
  regenerated from the case row. `approveAndSendLetter(caseId, letterNumber)` takes
  no letter text, checks ownership under the tenant session, then uses the service
  role only for the writes: a conditional update on `current_letter_number` as a
  lock against double sends, the letter message, the send, dispatch metadata, status
  `awaiting_landlord`, a `letter_dispatched` audit row with the tenant's approval
  and time, a tenant-visible timeline entry, a tenant confirmation, and an FYI to
  `ADMIN_EMAIL` with the case id only. A failed or skipped send rolls back the lock
  and the letter row. The admin page now builds LetterData through the same helper.
  No open PRs at start; main CI green; prod up.
- Learned: Letter 1 tells the landlord to send payment to the forwarding address, so
  the send now requires one (the admin flow would have rendered a blank). The
  `action_type` enum has no "approved" value, so approval lives in the
  `letter_dispatched` metadata (no migration, per spec). Letters 2/3 are blocked
  until the follow-up schedule exists. `sendEmail` reports success when Resend
  isn't configured; the new action treats that as not sent. Prod needs
  `SUPABASE_SERVICE_ROLE_KEY` in Vercel (SETUP Part A already asks for it).
- Next: slice 2, the tenant UI (BACKLOG Now #1).

## 2026-10-31 — build — timeline deadline label says 21 days
- Did: The tenant case timeline labeled the statutory deadline "(30 days)". It now
  renders `STATUTE_DAYS` (21, per § 47a-21). Added a render test that pins
  "(21 days)" and rejects "30 days". No open PRs at start; main CI green.
- Learned: the same timeline entry says "Landlord failed to return deposit" once
  the stored deadline passes, which states a fact Tribune doesn't know (the
  landlord may have paid, or the forwarding-address branch may give a later
  deadline). Worth softening in a later slice. The first local `next build` failed
  on a Google Fonts fetch; a rerun passed.
- Next: Tenant approve-and-send (Letter 1).

## 2026-10-30 — manual — full autonomy; build tick every 2 hours
- Did: Magnus granted full autonomy ("you merge or commit etc whenever you want...
  just dont spend my money or contact people without asking me"). Rewrote
  CHARTER (ask only for spend and contacting people), LOOP, BACKLOG, ESCALATIONS
  (closed E-003/E-004/E-005), the PLAN header, and CLAUDE.md. Merged #4. Moved the
  build routine from 3×/day to every 2 hours and rewrote both routine prompts to
  match.
- Learned: the 3pm build tick merged its own PR (#5) through the GitHub MCP; `gh`
  isn't authenticated in the cloud. Every 2 hours, not hourly, keeps runs inside the
  subscription without risking paid extra usage.
- Next: build ticks take the timeline "(30 days)" label fix, then approve-and-send.

## 2026-10-30 — build — triage function, display only (🟢 PR)
- Did: Added a pure `triageCase()` in `src/lib/triage.ts` returning
  `accept | decline | review` with per-check reasons (CT, residential, moved out,
  landlord email, amount withheld, stored deadline passed, lease on file), 31
  tests, and a Triage panel on the admin case page. Nothing acts on the verdict.
  Picked from open PR #3's backlog: approve-and-send (its #1) needs triage `accept`,
  so this is its first slice. PRs #3 and #4 were open and left alone.
- Learned: intake doesn't record residential vs. commercial, so that check is
  informational. No minimum withheld amount exists, so `> 0` passes. The triage
  doesn't compute deadlines; it compares the stored `statutory_deadline`, which
  ignores the forwarding-address branch. The tenant timeline labels the deadline
  "(30 days)" while the statute says 21; that's in BACKLOG as 🔴. `gh` isn't
  authenticated in the cloud env (the GitHub MCP works), and the classifier
  blocked deleting a stray `loop/test-push` branch I created to test push access.
- Next: once #3 merges, approve-and-send (🔴, waits on E-004) or the
  summer-cohort page (🟢).

## 2026-10-30 — manual — founder decisions recorded; letters fixed; loop live
- Did: recorded Magnus's decisions (no attorney, $0 budget, revenue first) across
  PLAN, CHARTER, SETUP, BACKLOG, and ESCALATIONS. Merged Phase 0 (#2). Fixed the
  three letter defects plus a prior-letter date bug (#4, 70/70 tests). Created the
  build routine (3×/day) and the review routine (Mondays) with connectors stripped.
- Learned: the permission classifier allowed merging #2 but refused #3 ("merge
  without review"), so self-merge isn't reliable. Added the "open PRs are claimed
  work" rule to LOOP.md and to the routine prompts so ticks don't duplicate work.
  Routines auto-attach Gmail, Calendar, and Docs even when created with an empty
  connector list. Cleared them afterwards.
- Next: Magnus merges #3 and #4, does SETUP Part A, and answers E-004. Build ticks
  start with the summer-cohort page; approve-and-send waits on E-004.

## 2026-10-28 — manual (Phase 0 kickoff) — plan approved, foundation laid
- Did: Magnus approved PLAN.md and the charter. Rewrote the stale letter and intake
  tests (21 failing → 64 passing) so they guard the legal invariants: 2× full
  deposit, exact deadline dates, no attorney framing, payment to the tenant.
  Added GitHub Actions CI (it builds with placeholder env, verified locally with
  no `.env.local`). Replaced the "within a few hours" SLA with a `REVIEW_SLA`
  constant ("within two business days") in 6 places, and fixed one "We're
  reviewing" voice slip. Wrote CHARTER, LOOP, BACKLOG, ESCALATIONS, SETUP, the
  legal packet, metrics SQL, and the read-only role SQL.
- Learned: prod (usetribune.org) serves the June 11 code. `reply.usetribune.org`
  MX already points at Resend inbound, so the TASKS.md note about root-domain
  replies was stale. Prod DB reads are blocked by the permission classifier
  without a standing rule, so real usage is still unknown. The SLA copy change
  wasn't browser-verified: the authenticated pages need a test login, and with no
  staging that would mean writing to the prod DB. Found three letter defects (E-003).
- Next: the build tick takes BACKLOG "Now" #1 (doc drift). Everything needing
  access waits on E-001.
